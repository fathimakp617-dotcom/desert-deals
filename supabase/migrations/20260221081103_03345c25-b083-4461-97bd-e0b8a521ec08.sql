-- Create storage bucket for order images
INSERT INTO storage.buckets (id, name, public) VALUES ('order-images', 'order-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload order images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'order-images' AND auth.role() = 'authenticated');

-- Public read access
CREATE POLICY "Public read access for order images"
ON storage.objects FOR SELECT
USING (bucket_id = 'order-images');