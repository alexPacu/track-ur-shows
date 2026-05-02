import * as v from 'valibot';

export const ProfilePutSchema = v.object({
  profile_picture_url:  v.optional(v.nullable(v.pipe(v.string(), v.maxLength(3_000_000, 'Profile picture too large (max ~2 MB)')))),
  background_image_url: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(6_000_000, 'Background image too large (max ~4 MB)')))),
});
export type ProfilePutInput = v.InferOutput<typeof ProfilePutSchema>;
