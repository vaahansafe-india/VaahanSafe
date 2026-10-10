'use client';
import {Button} from '@/components/ui/button';
export default function Error({reset}:{reset:()=>void}){return <div role="alert" className="mx-auto max-w-md space-y-4 py-12"><h1 className="font-serif text-2xl">Document Vault unavailable</h1><p className="text-sm text-muted-foreground">We couldn’t load your documents right now. Please try again.</p><Button onClick={reset}>Try again</Button></div>;}
