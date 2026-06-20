// vitest.config.ts
// Vitest yapılandırması — sadece pure logic testleri (src/shared/* ve benzeri
// DB/bağımlılıksız modüller). Electron/render bağımlı kod burada test edilmez.
// Refs: GROWTH_IDEAS S1, IMPROVEMENT_BRAINSTORM §1.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Pure logic — DOM gerektirmez. Node ortamı yeterli ve hızlı.
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    globals: false
  }
})
