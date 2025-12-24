-- Drop the restrictive policy first
DROP POLICY IF EXISTS "Images - users can view own or entity images" ON storage.objects;

-- Create the more inclusive policy
CREATE POLICY "Images - users can view own or entity images" ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'images' AND (
    -- 1. Owns the image
    (owner = auth.uid() OR owner_id = auth.uid()::text) OR
    
    -- 2. Image is in an entity folder I belong to
    (
      split_part(name, '/', 1) LIKE 'entity_%' AND
      EXISTS (
        SELECT 1 FROM actblue_accounts aa
        JOIN actblue_entities ae ON aa.entity_id = ae.entity_id
        WHERE aa.profile_id = auth.uid()
        AND split_part(name, '/', 1) = 'entity_' || ae.entity_id::text
      )
    ) OR

    -- 3. Image is explicitly referenced as the front_image for an entity I belong to (Legacy support)
    -- This allows viewing images stored in personal folders IF they are currently the active campaign image
    (
      EXISTS (
        SELECT 1 FROM actblue_accounts aa
        JOIN actblue_entities ae ON aa.entity_id = ae.entity_id
        WHERE aa.profile_id = auth.uid()
        AND ae.front_image_url LIKE '%/images/' || name || '%'
      )
    )
  )
);
