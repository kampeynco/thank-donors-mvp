
DROP POLICY IF EXISTS "Images - users can view own images" ON storage.objects;

CREATE POLICY "Images - users can view own or entity images" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'images' AND (
    (owner = auth.uid()) OR 
    (owner_id = (auth.uid())::text) OR
    (
        split_part(name, '/', 1) LIKE 'entity_%' AND
        EXISTS (
            SELECT 1 FROM public.actblue_accounts aa
            JOIN public.actblue_entities ae ON aa.entity_id = ae.entity_id
            WHERE aa.profile_id = auth.uid()
            AND split_part(storage.objects.name, '/', 1) = ('entity_' || ae.entity_id::text)
        )
    )
  )
);
