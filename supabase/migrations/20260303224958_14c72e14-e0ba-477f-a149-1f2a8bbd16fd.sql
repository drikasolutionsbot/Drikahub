-- Allow authenticated users to upload files to tenant-assets bucket
CREATE POLICY "Authenticated users can upload to tenant-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'tenant-assets');

-- Allow authenticated users to update/overwrite files in tenant-assets bucket
CREATE POLICY "Authenticated users can update tenant-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'tenant-assets');

-- Allow public read access to tenant-assets
CREATE POLICY "Public read access to tenant-assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tenant-assets');