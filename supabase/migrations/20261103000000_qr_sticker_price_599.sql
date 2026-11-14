UPDATE public.products
SET price_minor = 59900,
    updated_at = now()
WHERE id = 'prod_qr_sticker_kit'
  AND code = 'PROD_QR_STICKER_INDIVIDUAL'
  AND currency = 'INR';
