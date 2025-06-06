'use client'; 

import { useRouter } from 'next/navigation';
import Button from './Button';


export default function CloseButton() {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return <Button text="close" onClick={handleClose} />;
}