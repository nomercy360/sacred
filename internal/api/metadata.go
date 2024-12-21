package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"sync"
)

type MetadataFetchJob struct {
	ItemID string
	URL    string
}

type MetadataResponse struct {
	Title         string            `json:"title"`
	Meta          map[string]string `json:"meta"`
	ScreenShotURL string            `json:"screenshot_url"` // TODO: not yet implemented
}

func fetchMetadataFromExternalService(metaFetchURL, url string) (MetadataResponse, error) {
	resp, err := http.Get(fmt.Sprintf("%s/meta-fetcher?url=%s", metaFetchURL, url))
	if err != nil {
		return MetadataResponse{}, fmt.Errorf("failed to create HTTP request: %w", err)
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return MetadataResponse{}, fmt.Errorf("unexpected status code from scraper API: %d", resp.StatusCode)
	}

	var meta MetadataResponse
	if err := json.NewDecoder(resp.Body).Decode(&meta); err != nil {
		return MetadataResponse{}, fmt.Errorf("failed to decode JSON response: %w", err)
	}

	return meta, nil
}

func (a *API) StartMetadataWorker(ctx context.Context, job MetadataFetchJob) error {
	log.Printf("Processing resp fetch job for URL: %s", job.URL)

	resp, err := fetchMetadataFromExternalService(a.cfg.MetaFetchURL, job.URL)
	if err != nil {
		return fmt.Errorf("failed to fetch resp: %v", err)
	}

	item, err := a.storage.GetWishByID(ctx, job.ItemID)
	if err != nil {
		return fmt.Errorf("failed to get item from db: %v", err)
	}

	if title, ok := resp.Meta["og:title"]; ok {
		item.Name = title
	} else if resp.Title != "" {
		item.Name = resp.Title
	}

	if price, ok := resp.Meta["og:price:amount"]; ok {
		priceNum, err := strconv.ParseFloat(price, 64)
		if err != nil {
			return fmt.Errorf("failed to parse price: %v", err)
		}
		item.Price = &priceNum
	}

	if currency, ok := resp.Meta["og:price:currency"]; ok {
		item.Currency = &currency
	}

	if imageURL, ok := resp.Meta["og:image"]; ok {
		item.ImageURL = &imageURL
	}

	if _, err := a.storage.UpdateWish(ctx, item); err != nil {
		return fmt.Errorf("failed to update item resp in db: %v", err)
	}

	log.Printf("Successfully processed resp fetch job for ItemID: %d", job.ItemID)
	return nil
}

func (a *API) InitializeJobQueue(ctx context.Context) {
	a.jobQueue = make(chan MetadataFetchJob, 100) // Buffer size for the queue
	a.mutex = &sync.Mutex{}

	go a.backgroundWorker(ctx)
}

func (a *API) EnqueueJob(job MetadataFetchJob) {
	go func() {
		a.jobQueue <- job
		log.Printf("Job enqueued for ItemID: %d", job.ItemID)
	}()
}

func (a *API) backgroundWorker(ctx context.Context) {
	for {
		select {
		case job := <-a.jobQueue:
			a.mutex.Lock() // Ensure only one job is processed at a time
			err := a.StartMetadataWorker(ctx, job)
			a.mutex.Unlock()
			if err != nil {
				log.Printf("Error processing job for ItemID: %d: %v", job.ItemID, err)
			}
		case <-ctx.Done():
			log.Println("Shutting down metadata background worker")
			return
		}
	}
}
