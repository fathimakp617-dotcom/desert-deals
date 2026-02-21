-- Drop restrictive policy and allow any user to upload order images
DROP POLICY IF EXISTS "Authenticated users can upload order images" ON storage.objects;

CREATE POLICY "Anyone can upload order images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-images');

-- Also allow updates (upsert)
CREATE POLICY "Anyone can update order images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'order-images');