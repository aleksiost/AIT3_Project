# Lähiavaruuden vahtikoira (Near-Space Dashboard)

* **Tekijä:** Aleksios Tuovinen
* **Teknologiat:** HTML5, Vanilla CSS (Glassmorphism), Vanilla JavaScript, HTML5 Canvas

Lähiavaruuden vahtikoira on selainpohjainen avaruustutka, joka muuttaa NASA:n avoimen datan visuaaliseksi kojelaudaksi. Sovellus hakee DSCOVR-satelliitin tuoreimman maapallokuvan (NASA EPIC API) ja piirtää sen ympärille kuluvan päivän Maan ohittavat asteroidit (NASA NeoWs API) suhteutettuna niiden ohitusetäisyyteen.

## Käynnistys ja käyttö

Sovellus toimii täysin selaimessa eikä vaadi erillisiä asennuksia tai taustapalvelinta:

1. Kloonaa tai lataa tämä repositorio omalle koneellesi.
2. Avaa `index.html`-tiedosto verkkoselaimessa (esim. Google Chrome tai Microsoft Edge).
3. Paina käyttöliittymän **Scan**-painiketta ladataksesi tuoreimman maapallokuvan ja asteroidihavainnot.
4. Vie hiiri valopisteiden päälle nähdäksesi asteroidin tarkemmat tiedot (nimi, koko, ohitusetäisyys, nopeus ja vaarallisuusluokitus).
5. Rajaa näkymä vain potentiaalisesti vaarallisiin kohteisiin (PHA) yläkulman **Näytä vain vaaralliset** -valintaruudulla.

### API-avain (DEMO_KEY)
Sovellus käyttää oletuksena NASA:n julkista `DEMO_KEY`-avainta (rajoitus: 30 kyselyä tunnissa / 50 päivässä per IP-osoite). Jos kyselyraja täyttyy testauksen aikana, voit hakea maksuttoman oman avaimen osoitteesta [api.nasa.gov](https://api.nasa.gov/) ja vaihtaa sen `app.js`-tiedoston alkuun (`const API_KEY = '...'`).

## Testauksen toistaminen

* **Toiminnallinen testaus:** Suorita yllä olevat käyttövaiheet ja varmista selaimen kehitystyökaluilla (`F12` -> *Console*), että data jäsentyy ilman virheitä.
* **Virheenkäsittelyn testaus (V6):** Avaa selaimen kehitystyökalut (`F12` -> *Network*), vaihda verkkotilaksi **Offline** ja paina **Scan**. Sovelluksen tulee näyttää selkeä virheilmoitus kaatumatta ja toipua, kun verkkoyhteys palautetaan (**No throttling**) ja skannaus ajetaan uudelleen.

## Projektin dokumentaatio

* Lue [projektin määrittely ja hyväksymiskriteerit](docs/01-projektikuvaus.md).

* Lue [projektissa käytetyt alkupromptit, AI-työkalut ja työskentelytavat](docs/02-ai-tyoskentely.md).

* Lue [projektin testauksesta](docs/03-testaus-ja-validointi.md).

* Lue [projektin palautus.](docs/04-palautus.md).
