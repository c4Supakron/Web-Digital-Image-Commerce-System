CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT,
  google_id VARCHAR(255) UNIQUE,
  phone VARCHAR(30),
  bio TEXT NOT NULL DEFAULT '',
  role VARCHAR(20) NOT NULL DEFAULT 'MEMBER'
    CHECK (role IN ('ADMIN', 'ARTIST', 'MEMBER')),
  artist_status VARCHAR(20) NOT NULL DEFAULT 'NOT_APPLIED'
    CHECK (artist_status IN ('NOT_APPLIED', 'PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT NOT NULL DEFAULT '';

ALTER TABLE users ADD COLUMN IF NOT EXISTS artist_status VARCHAR(20) NOT NULL DEFAULT 'NOT_APPLIED'
  CHECK (artist_status IN ('NOT_APPLIED', 'PENDING', 'APPROVED', 'REJECTED'));
UPDATE users SET artist_status = 'APPROVED' WHERE role = 'ARTIST' AND artist_status = 'NOT_APPLIED';

CREATE INDEX IF NOT EXISTS users_email_lower_idx ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS user_sessions (
  sid VARCHAR NOT NULL PRIMARY KEY,
  sess JSON NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions (expire);

CREATE TABLE IF NOT EXISTS products (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  image TEXT NOT NULL,
  owner_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  artist VARCHAR(160) NOT NULL DEFAULT 'ศิลปินอิสระ',
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_title_key;
CREATE INDEX IF NOT EXISTS products_owner_active_idx ON products (owner_user_id, active);
CREATE INDEX IF NOT EXISTS products_category_active_idx ON products (category, active);
CREATE INDEX IF NOT EXISTS products_price_active_idx ON products (price) WHERE active = TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS products_owner_title_active_idx
  ON products (owner_user_id, LOWER(title)) WHERE owner_user_id IS NOT NULL AND active = TRUE;

CREATE TABLE IF NOT EXISTS favorites (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS cart_items (
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS user_addresses (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_name VARCHAR(160) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address_line VARCHAR(250) NOT NULL,
  province VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  subdistrict VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  notes VARCHAR(1000) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_addresses_user_updated_idx ON user_addresses (user_id, updated_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED')),
  payment_status VARCHAR(30) NOT NULL DEFAULT 'AWAITING_PAYMENT'
    CHECK (payment_status IN ('AWAITING_PAYMENT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 200 CHECK (shipping_fee >= 0),
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  shipping_address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) NOT NULL DEFAULT 'AWAITING_PAYMENT'
  CHECK (payment_status IN ('AWAITING_PAYMENT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_carrier VARCHAR(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(80);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES products(id) ON DELETE SET NULL,
  title VARCHAR(180) NOT NULL,
  image TEXT NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS payment_proofs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mime_type VARCHAR(50) NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'application/pdf')),
  file_size INTEGER NOT NULL CHECK (file_size BETWEEN 1 AND 5242880),
  proof_data BYTEA NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_proofs_order_submitted_idx ON payment_proofs (order_id, submitted_at DESC);

CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment VARCHAR(1000) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS product_reviews_product_created_idx ON product_reviews (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders (user_id, created_at DESC);

INSERT INTO products (title, price, image, artist, category, description)
SELECT seed.title, seed.price, seed.image, seed.artist, seed.category, seed.description
FROM (VALUES
  ('Abstract Horizon #4', 12500, '/artworks/samples/colorful-abstraction.png', 'ศุภกร หวันลา', 'Abstract', 'ผลงานศิลปะแนวนามธรรม ภาพตัวอย่าง'),
  ('Golden Hour Valley', 8900, '/artworks/samples/starry-night.png', 'ศุภกร หวันลา', 'Landscape', 'ทิวทัศน์ยามเย็น ภาพตัวอย่าง'),
  ('Urban Geometry', 15000, 'https://images.unsplash.com/photo-1577720580479-7d839d829c73?w=600', 'ชิษณุกร มาดจินดา', 'Abstract', 'รูปทรงเรขาคณิตในเมือง'),
  ('Minimalist Lines', 4500, 'https://images.unsplash.com/photo-1582201942988-13e60e4556ee?w=600', 'ศิลปินอิสระ', 'Minimalism', 'ศิลปะเส้นสายมินิมอล'),
  ('Blue Fluidity', 9200, 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600', 'ศิลปินอิสระ', 'Abstract', 'สีสันลื่นไหลในโทนน้ำเงิน'),
  ('Modern Cubism', 7800, 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600', 'ศิลปินอิสระ', 'Portrait', 'ผลงานคิวบิสม์ร่วมสมัย'),
  ('Mona Lisa', 18000, '/artworks/samples/mona-lisa.png', 'Leonardo da Vinci', 'Renaissance', 'ภาพตัวอย่างผลงานภาพเหมือนยุคเรอเนซองส์'),
  ('The Son of Man', 14500, '/artworks/samples/son-of-man.png', 'René Magritte', 'Surrealism', 'ภาพตัวอย่างงานศิลปะเหนือจริง'),
  ('Church at Auvers', 13800, '/artworks/samples/church-at-auvers.png', 'Vincent van Gogh', 'Post-Impressionism', 'ภาพตัวอย่างทิวทัศน์สีน้ำมัน'),
  ('Liberty Leading the People', 16500, '/artworks/samples/liberty-leading-the-people.png', 'Eugène Delacroix', 'Romanticism', 'ภาพตัวอย่างงานศิลปะแนวโรแมนติก'),
  ('Skull with a Burning Cigarette', 7900, '/artworks/samples/skull-with-burning-cigarette.png', 'Vincent van Gogh', 'Post-Impressionism', 'ภาพตัวอย่างภาพวาดหุ่นนิ่ง'),
  ('Starry Night — Swirling Sky', 12900, '/artworks/samples/starry-night-detail.png', 'Vincent van Gogh', 'Post-Impressionism', 'ภาพตัวอย่างท้องฟ้ายามค่ำคืน'),
  ('Color Study — Woman', 9800, '/artworks/samples/cubist-woman.png', 'ศิลปินอิสระ', 'Modern', 'ภาพตัวอย่างงานศิลปะสีสันร่วมสมัย'),
  ('Cubist Music', 11000, '/artworks/samples/cubist-music.png', 'ศิลปินอิสระ', 'Cubism', 'ภาพตัวอย่างงานศิลปะคิวบิสม์')
) AS seed(title, price, image, artist, category, description)
WHERE NOT EXISTS (SELECT 1 FROM products existing WHERE existing.title = seed.title)
ON CONFLICT DO NOTHING;

-- Replace only the original placeholder artwork files without overwriting managed product images.
UPDATE products
SET image = CASE title
  WHEN 'Abstract Horizon #4' THEN '/artworks/samples/colorful-abstraction.png'
  WHEN 'Golden Hour Valley' THEN '/artworks/samples/starry-night.png'
END
WHERE (title = 'Abstract Horizon #4' AND image = '/artworks/abstract-horizon.svg')
   OR (title = 'Golden Hour Valley' AND image = '/artworks/golden-hour-valley.svg');
