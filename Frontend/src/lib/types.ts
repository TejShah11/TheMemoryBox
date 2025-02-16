export interface Album {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  created_at: string;
}

export interface Image {
  id: string;
  public_url: string;
  description: string | null;
  owner: string;
  created_at: string;
}

export interface AlbumImage {
  album_id: string;
  image_id: string;
  created_at: string;
}
