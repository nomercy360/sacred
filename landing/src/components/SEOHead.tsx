import { Title, Meta, Link } from "@solidjs/meta";

interface SEOProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  author?: string;
  keywords?: string;
}

export function SEOHead(props: SEOProps) {
  const siteTitle = "Sacred Wishes";
  const fullTitle = `${props.title} | ${siteTitle}`;
  const defaultImage = "https://assets.peatch.io/og-image.jpg";
  
  return (
    <>
      <Title>{fullTitle}</Title>
      <Meta name="description" content={props.description} />
      {props.keywords && <Meta name="keywords" content={props.keywords} />}
      
      <Meta property="og:title" content={props.title} />
      <Meta property="og:description" content={props.description} />
      <Meta property="og:image" content={props.image || defaultImage} />
      <Meta property="og:url" content={props.url || (typeof window !== "undefined" ? window.location.href : "")} />
      <Meta property="og:type" content={props.type || "website"} />
      <Meta property="og:site_name" content={siteTitle} />
      
      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:title" content={props.title} />
      <Meta name="twitter:description" content={props.description} />
      <Meta name="twitter:image" content={props.image || defaultImage} />
      
      {props.type === "article" && (
        <>
          {props.publishedTime && <Meta property="article:published_time" content={props.publishedTime} />}
          {props.author && <Meta property="article:author" content={props.author} />}
        </>
      )}
      
      {props.url && <Link rel="canonical" href={props.url} />}
    </>
  );
}