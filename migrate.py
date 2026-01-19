import os
import shutil

# --- AYARLAR ---
# Eski proje ismini buraya yaz (valute-core mu, valute mi emin ol)
OLD_PROJECT_NAME = "valute" 
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SOURCE_DIR = os.path.join(BASE_DIR, "..", OLD_PROJECT_NAME)
DEST_DIR = BASE_DIR

print(f"🚀 Migration Başlıyor...")
print(f"📂 Kaynak: {SOURCE_DIR}")
print(f"📂 Hedef:  {DEST_DIR}")

def copy_folder(src, dest):
    if os.path.exists(src):
        if os.path.exists(dest):
            shutil.rmtree(dest)
        shutil.copytree(src, dest)
        print(f"✅ Kopyalandı: {dest}")
    else:
        print(f"⚠️  BULUNAMADI: {src}")

def copy_file(src, dest):
    if os.path.exists(src):
        shutil.copy2(src, dest)
        print(f"✅ Dosya: {os.path.basename(dest)}")
    else:
        print(f"⚠️  Dosya Yok: {src}")

# 1. Drizzle Migration
os.makedirs(os.path.join(DEST_DIR, "drizzle"), exist_ok=True)

# Schema dosyasını bul ve adını değiştirerek taşı
old_schema = os.path.join(SOURCE_DIR, "Database Schema (Drizzle ORM).ts")
new_schema = os.path.join(DEST_DIR, "drizzle", "schema.ts")
if os.path.exists(old_schema):
    shutil.copy2(old_schema, new_schema)
    print("✅ Schema Taşındı ve Yeniden Adlandırıldı.")
else:
    # Belki eski projede adı farklıdır, kontrol et
    alt_schema = os.path.join(SOURCE_DIR, "src", "main", "db", "schema.ts")
    if os.path.exists(alt_schema):
        shutil.copy2(alt_schema, new_schema)
        print("✅ Schema (Alt Yol) Taşındı.")

# Migrations klasörü
copy_folder(os.path.join(SOURCE_DIR, "src", "main", "db", "migrations"), 
            os.path.join(DEST_DIR, "drizzle", "migrations"))

# Drizzle Config
copy_file(os.path.join(SOURCE_DIR, "drizzle.config.ts"), 
          os.path.join(DEST_DIR, "drizzle.config.ts"))

# 2. Main Process
copy_folder(os.path.join(SOURCE_DIR, "src", "main"), 
            os.path.join(DEST_DIR, "src", "main"))

# 3. Renderer Process
copy_folder(os.path.join(SOURCE_DIR, "src", "renderer", "src"), 
            os.path.join(DEST_DIR, "src", "renderer", "src"))

# 4. Configs
copy_file(os.path.join(SOURCE_DIR, "tailwind.config.js"), 
          os.path.join(DEST_DIR, "tailwind.config.js"))

print("\n🎉 BÜYÜK GÖÇ TAMAMLANDI! Şimdi 'npm run dev' diyebilirsin.")