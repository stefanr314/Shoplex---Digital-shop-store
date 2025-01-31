# SHOPLEX - Digitalna prodavnica

**SHOPLEX** je digitalna prodavnica razvijena pomoću **Node.js** i **SSR (Server-Side Rendering)** uz korišćenje **MongoDB** baze podataka. Aplikacija omogućava registrovanim korisnicima da:

- Prijave se za nalog
- Pretražuju proizvode
- Dodaju, ažuriraju i brišu proizvode
- Obavljaju kupovine
- Šalju mejlove putem integracije sa **SendGrid** API-jem

## Ključne funkcionalnosti

- **Registracija i autentifikacija korisnika**: Korisnici mogu da se registruju i prijave kako bi obavljali kupovine i upravljali svojim nalogom.
- **Upravljanje proizvodima**: Registrovani korisnici mogu da dodaju nove proizvode, ažuriraju postojeće ili ih brišu.
- **Slanje mejlova**: Integracija sa **SendGrid** omogućava slanje potvrda i obaveštenja korisnicima.
- **MongoDB**: Aplikacija koristi MongoDB za skladištenje podataka o korisnicima, proizvodima i narudžbinama.

## Kako pokrenuti aplikaciju

Aplikacija koristi **authController** za autentifikaciju korisnika putem JWT tokena. Prvo, potrebno je da pravilno postavite sve environment varijable i da imate lokalnu MongoDB bazu ili MongoDB Atlas instancu.

### 1. Klonirajte repozitorijum:

```bash
git clone https://github.com/vaš-username/Shoplex.git
```

### 2. Instalirajte zavisnosti:

Nakon što ste klonirali repozitorijum, instalirajte sve potrebne npm pakete:

```bash
cd Shoplex
npm install
```
### 3. Kreirajte `.env` fajl:

Kreirajte `.env` fajl u root direktorijumu aplikacije i dodajte sledeće varijable:

MONGODB_URI=your_mongodb_connection_string SENDGRID_API_KEY=your_sendgrid_api_key 


- **MONGODB_URI**: Vaš MongoDB URI za povezivanje sa bazom podataka.
- **SENDGRID_API_KEY**: Vaš API ključ za SendGrid (ako planirate koristiti slanje mejlova).

### 4. Pokrenite aplikaciju:

Nakon što ste konfigurisali `.env` fajl, pokrenite aplikaciju pomoću:

```bash
nodemon ./app.js
```
Aplikacija će biti dostupna na http://localhost:3000.

## Tehnologije

- **Node.js**: Backend aplikacije je razvijen korišćenjem Node.js.
- **MongoDB**: Koristi se za upravljanje bazom podataka i skladištenje podataka o korisnicima i proizvodima.
- **SendGrid**: Koristi se za slanje mejlova korisnicima.
- **Express.js**: Korišćen za kreiranje API-ja.
- **JWT (JSON Web Token)**: Korišćen za autentifikaciju korisnika.
- **SSR (Server-Side Rendering)**: Aplikacija koristi SSR za bolju SEO optimizaciju i brže učitavanje stranica.
