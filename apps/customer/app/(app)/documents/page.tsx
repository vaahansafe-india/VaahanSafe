import type {Metadata} from 'next';
import {redirect} from 'next/navigation';
import {customer,listDocuments,VaultError} from '@/features/document-vault/server';
import {DocumentVault} from '@/features/document-vault/DocumentVault';
export const metadata:Metadata={title:'Document Vault — VaahanSafe',description:'Private stored copies of your important vehicle documents.',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function DocumentsPage(){try{await customer();return <DocumentVault initialData={await listDocuments(new URLSearchParams())}/>;}catch(e){if(e instanceof VaultError&&e.code==='UNAUTHORIZED')redirect('/login');throw e;}}
