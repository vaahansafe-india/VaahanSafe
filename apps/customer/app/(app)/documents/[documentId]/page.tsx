import {DocumentVault} from '@/features/document-vault/DocumentVault';
import {customer,listDocuments,command} from '@/features/document-vault/server';
export const dynamic='force-dynamic';
export default async function DocumentPage({params}:{params:Promise<{documentId:string}>}){await customer();const {documentId}=await params;await command('detail',{id:documentId});return <DocumentVault initialData={await listDocuments(new URLSearchParams())} documentId={documentId} fullScreen/>;}
