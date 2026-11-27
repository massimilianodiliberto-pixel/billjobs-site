# RAPPORTO DI CHIUSURA — m-dl.it
**Sessione:** session_018XDXnGYCCNBWxBxWSTvD3m  
**Data:** 2026-11-27  
**Repository:** massimilianodiliberto-pixel/billjobs-site

---

## 1. Obiettivo della chat
Manutenzione e aggiornamento del sito personale **www.m-dl.it** (Massimiliano Di Liberto, Creative Producer & Director):
- Rimozione di tutti i riferimenti visibili a "Bill Jobs" dal sito m-dl.it
- Fix video hero (playback sequenziale su iOS Safari)
- Riduzione animazioni pesanti per TV/Android
- Rimozione video in loop di sfondo (flash.mov) da Author e System
- Rimozione pannello Bill Jobs reel da System
- Aggiornamento sezione Signal/contact
- Configurazione GitHub Pages + dominio www.m-dl.it

---

## 2. Cosa è stato prodotto e dove si trova

### File modificati
| File | Modifica | Branch | Commit |
|------|----------|--------|--------|
| `index.html` | Rimozione Bill Jobs, fix video sequenziale, titolo editoriale rimosso | `claude/build-mdl-portfolio-MwDgB` | `cfd1fa7`, `bdd9111` |
| `about/index.html` | Rimosso video flash.mov, rimosso titolo editoriale, tenuto link SYSTEM | `claude/build-mdl-portfolio-MwDgB` | `07fd00c` |
| `system/index.html` | Rimosso video flash.mov, rimossa intera sezione "Who is Bill Jobs?", rimosso overlay YouTube, aggiunto link WORK | `claude/build-mdl-portfolio-MwDgB` | `07fd00c` |
| `work/index.html` | Rimossa dicitura "Bill Jobs Studio" dal footer | `claude/build-mdl-portfolio-MwDgB` | `cfd1fa7` |
| `contact/index.html` | Testo studio aggiornato, logo diventa link a billjobs.it, www.billjobs.it al posto della email | `claude/build-mdl-portfolio-MwDgB` | `cfd1fa7`, `07fd00c` |
| `assets/css/style.css` | Animazione pulsante editoriale con glow CSS; `reveal-up` 40px→18px, `reveal-fade` 0.97→0.99 | `claude/build-mdl-portfolio-MwDgB` | `cfd1fa7`, `07fd00c` |

### Branch
- **Ramo di lavoro:** `claude/build-mdl-portfolio-MwDgB` (su `massimilianodiliberto-pixel/billjobs-site`)
- **Ramo di deploy:** `gh-pages` (merge del ramo di lavoro eseguito in questa sessione, commit `086ef38`)

### URL online
- **Sito live:** https://www.m-dl.it (GitHub Pages, branch `gh-pages`)
- **DNS:** Cloudflare (4 record A → GitHub Pages IPs + CNAME www → `massimilianodiliberto-pixel.github.io`)
- **HTTPS:** attivo (certificato emesso da GitHub/Let's Encrypt)

### Configurazione GitHub
- **Custom domain:** `www.m-dl.it` verificato e attivo in GitHub Pages settings
- **Dominio verificato account:** `m-dl.it` verificato in `github.com/settings/pages`
- **TXT record DNS aggiunto:** `_github-pages-challenge-massimilianodiliberto-pixel.m-dl.it`

---

## 3. Decisioni di Massimiliano

| Data | Decisione |
|------|-----------|
| Sessione | Rimuovere TUTTI i riferimenti visibili "Bill Jobs" da m-dl.it (mantenendo solo URL/link a billjobs.it) |
| Sessione | Rimuovere video flash.mov in loop di sfondo da Author e System |
| Sessione | Rimuovere il pannello "Who is Bill Jobs?" con reel YouTube da System |
| Sessione | In Signal: testo "Massimiliano Di Liberto Owner Bill Jobs Studio", logo come link, www.billjobs.it sotto |
| Sessione | Per immagini duplicate billjobs.it → opzione B: upload manuale (non effettuato in questa sessione) |
| Sessione | Regola: non modificare mai m-dl.it da sessioni billjobs-main e viceversa |

---

## 4. Cosa è pubblicato online oggi

| Sito | Repository | Ramo | Hosting | Dominio |
|------|-----------|------|---------|---------|
| m-dl.it (sito personale MDL) | `massimilianodiliberto-pixel/billjobs-site` | `gh-pages` | GitHub Pages | www.m-dl.it via Cloudflare DNS |
| billjobs.it (sito studio) | `massimilianodiliberto-pixel/billjobs-main` | (non gestito da questa sessione) | Vercel | www.billjobs.it |

---

## 5. Cosa resta aperto

| Problema | Stato | Note |
|----------|-------|------|
| Video hero nero su Android/Chrome | Aperto | I file `.mov` non sono supportati da Chrome/Android. Servono versioni MP4 (`ffmpeg -movflags +faststart`). I file video NON sono nel repo git |
| Suono on/off non funziona su Android | Non investigato | Sistema audio in `assets/js/core.js` |
| Upload immagini billjobs.it | Aperto | `logo_billjobs.png` e `Logo Who Is BillJobsd.jpg` vanno caricati manualmente su billjobs-main/assets/img/ |
| Nuova homepage billjobs.it | In sospeso | Design creato in sessione precedente e salvato in `/home/user/billjobs-main/index.html` nel container (non nel repo) — da pushare su billjobs-main in una sessione dedicata |

---

## 6. Rischi e cose da non perdere

- **File video non nel repo:** `assets/video/flash.mov`, `assets/video/Analog Overlay 8.mp4`, `assets/video/Analog Transition 6.mp4` sono referenziati nel codice ma **non committati** nel repository. Esistono solo sul server di origine (Massimiliano li ha). Se si perdono, il fallback è silenzioso (i video non partono ma il sito funziona).
- **Homepage billjobs-main:** Il file `/home/user/billjobs-main/index.html` creato in sessione precedente esiste **solo nel container** della sessione billjobs-main (non in questo repo). Va recuperato da quella sessione o ricostruito.
- **Nessun segreto** gestito in questa sessione. Le credenziali Cloudflare non erano disponibili né sono state usate.

---

## 7. I 3 documenti più importanti da conservare

1. **`gh-pages` branch** di `massimilianodiliberto-pixel/billjobs-site` — è il sito live. Commit critico: `086ef38` (merge).
2. **`assets/css/style.css`** nel branch `claude/build-mdl-portfolio-MwDgB` — contiene tutti gli aggiornamenti CSS incluso il glow pulsante.
3. **Record DNS Cloudflare** per `m-dl.it` — 4 record A (185.199.108-111.153) + CNAME www + TXT verifica GitHub. Se si perdono il sito va offline.
