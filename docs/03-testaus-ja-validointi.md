# Testaus ja validointi

Tämä dokumentti kuvaa Lähiavaruuden vahtikoira -projektin testauksen ja validoinnin. Testaus on jaettu projektin kehitysvaiheiden mukaisesti.

## Testiympäristö
* **Ympäristö:** Google Chrome (versio XXX, päivitä tämä omaasi)
* **Käyttöjärjestelmä:** Windows 11 / macOS (päivitä tämä omaasi)
* **API-avaimet:** Testeissä käytetty NASA:n DEMO_KEY-avainta.

---

## Vaihe 1: Käyttöliittymä ja EPIC-kuvan haku

Tässä vaiheessa testattiin käyttöliittymän asettelua ja maapallokuvan (EPIC API) hakemista sekä sen visualisointia asetetun glassmorphism-tyylin mukaisesti.

### Testitapaus 1: Kuvan haku ja käyttöliittymän asettelu (Normaalitapaus)
* **Vaatimus:** V1 (Maapallon kuvan haku)
* **Lähtötilanne:** Sovellus käynnistetään selaimessa `index.html`-tiedostosta. Verkkoyhteys on aktiivinen.
* **Koe:** Sivun latautuminen ja automaattisen kuvahaun suorittaminen.
* **Odotettu tulos:**
  1. Sivupalkki ja käyttöliittymä asettuvat lasimaisen (glassmorphism) tyylin mukaisesti.
  2. Keskelle ruutua latautuu oikea, NASA:n rajapinnasta haettu tuorein maapallon kuva.
  3. Kuvan ympärillä on CSS:llä toteutettu hehku (box-shadow) ja kevyt zoom-animaatio.
* **Havaittu tulos (Ensimmäinen ajo):** 
  Käyttöliittymän tyyli ja sivupalkki olivat täsmälleen oikeanlaiset. Oikea maapallon kuva ilmestyi onnistuneesti näkyviin ja aikaleima päivittyi. 
  **VIRHE:** Maapallon ympärille määritelty hehku ei asettunut kuvan ympärille oikein (skaalaus oli väärin), eikä hehku seurannut kuvan zoom-animaatiota synkronoidusti.
* **Johtopäätös:** Epäonnistunut. Vaatii korjauksen CSS-tyyleihin hehkun säteen ja animaation osalta.

### Korjaus ja uusintatesti
* **Tehty korjaus:** CSS-tyylejä muokattiin. Hehkon (box-shadow) sädettä pienennettiin niin, että se asettuu tiukemmin maapallon ääriviivoille. Lisäksi zoom-animaatio (transform: scale) yhdistettiin hehkun animaatioon siten, että molemmat skaalautuvat samassa tahdissa.
* **Uusintatestin havaittu tulos:** Kuva latautuu edelleen oikein. Hehku asettuu nyt täydellisesti maapallon reunoille ja sykkii synkronoidusti kuvan zoomauksen kanssa.
* **Johtopäätös:** **Läpäisty.** Vaatimus V1 toteutuu halutulla tavalla.

Kuva vaiheesta 1:
<img width="959" height="410" alt="image" src="https://github.com/user-attachments/assets/58dca9c2-5cbe-4bfe-b91b-d7f498cfbc84" />

--------------------------------------------------------------------------------------------------------------------------

## Vaihe 2: Asteroididatan haku (NeoWs API) ja käyttöliittymän päivitys

Tässä vaiheessa testattiin NASA:n NeoWs-rajapinnan kutsumista, datan jäsentämistä oikeaan muotoon koodin sisällä sekä HUD-paneelin aikaleimojen ja lukumäärien päivitystä.

### Testitapaus 2: Datan haku, jäsennys ja HUD-paneelin päivitys (Normaalitapaus)
* **Vaatimukset:** V2 (Asteroididatan haku), V4 (Aikaleimojen esittäminen, osittain)
* **Lähtötilanne:** Sovellus käynnistetään selaimessa. Selaimen kehitystyökalut (F12) ja Console-välilehti ovat auki.
* **Koe:** Sivun latautuminen ja automaattisen `fetchNeoData()` -funktion suorittaminen kuluvalle päivämäärälle (esim. 17.11.2026).
* **Odotettu tulos:**
  1. Funktio hakee onnistuneesti rajapinnasta kuluvan päivän dataa ilman kaatumista.
  2. Käyttöliittymän HUD-paneelissa olevat erilliset `<span>`-elementit (`#neo-timestamp` ja `#neo-count`) päivittyvät kertomaan oikean päivämäärän ja löydettyjen asteroidien lukumäärän (tämä tarkennettu rakenne korvasi alkuperäisen yksittäisen p-elementin tekoälyn ehdotuksesta).
  3. Selaimen konsoliin tulostuu jäsennelty lista objekteista (Array), joista jokainen sisältää selkeästi nimettyinä kenttinä: Nimi, Koko (max metriä), Ohitusetäisyys (km) ja Vaarallinen (PHA - boolean).
* **Havaittu tulos:** 
  API-haku onnistui. Käyttöliittymän `#neo-timestamp` ja `#neo-count` -elementit päivittyivät tyylikkäästi osana lasimaista HUD-paneelia rikkomatta ulkoasua. Konsoliin tulostui teksti "Asteroidit (2026-11-17): 8 kpl" ja taulukko, joka sisälsi tasan 8 objektia. Datarakenne oli täysin odotetun mukainen: esimerkiksi indeksi 0 palautti asteroidin "322756 (2001 CK32)" (koko 847 metriä) ja indeksissä 7 ollut "(2020 DR2)" palautti `Vaarallinen (PHA): true`, mikä vahvistaa, että boolean-tieto siirtyy oikein tulevaa suodatuslogiikkaa varten.
* **Johtopäätös:** **Läpäisty.** API-haku, käyttöliittymän tekstien päivitys DOM:iin ja datan muotoilu (parsing) toimivat täydellisesti odotetulla tavalla.

Kuva vaiheesta 2:

<img width="686" height="200" alt="image" src="https://github.com/user-attachments/assets/1e839483-eb9c-4b29-bbf0-c0f594700100" />

-----------------------------------------------------------------------------------------------------------------------------

## Vaihe 3: Valopisteiden visualisointi (Canvas) ja päivityslogiikka

Tässä vaiheessa testattiin asteroididatan piirtämistä visuaalisina elementteinä maapallokuvan ympärille (Canvas-elementille) sekä käyttöliittymän suodattimen ja selaimen skaalauksen vaikutusta niihin.

### Testitapaus 3: Asteroidien sijoittelu, piirto ja tilanhallinta (Normaali- ja virhetapaus)
* **Vaatimukset:** V3 (Visuaalinen esittäminen valopisteinä), V5 (Datan suodatus, osittain)
* **Lähtötilanne:** Sovellus käynnistetään selaimessa. Rajapinnasta palautuu 8 asteroidia.
* **Koe:** Tarkistetaan valopisteiden tyyli, lukumäärä ja sijoittelu ruudulla. Kokeillaan muuttaa selaimen ikkunan kokoa ja klikata PHA-suodatinta (Näytä vain vaaralliset) päälle ja pois.
* **Odotettu tulos:**
  1. Ruudulle piirtyy tarkalleen rajapinnan ilmoittama määrä (8 kpl) valopisteitä maapallon ympärille siten, että ne ovat kaikki näkyvissä.
  2. Pisteiden tyyli on asetusten mukainen ja vaaralliset kohteet on värikoodattu erikseen.
  3. Suodattimen käyttö poistaa ei-vaaralliset kohteet näkyvistä, mutta ei muuta jäljelle jäävien sijaintia.
  4. Ikkunan koon muuttaminen pitää asteroidit paikoillaan suhteessa maapalloon.
* **Havaittu tulos (Ensimmäinen ajo):** 
  Värikoodaus ja valopisteiden visuaalinen tyyli (hohto ja valojana) toimivat erinomaisesti odotusten mukaisesti. 
  **VIRHE 1 (Sijoittelu):** Kaikki 8 asteroidia eivät näkyneet ruudulla (näkyi vain 4 tai 5), koska niiden satunnainen sijoittelu hajotti osan pisteistä selaimen ikkunan/näytön ulkopuolelle.
  **VIRHE 2 (Tilanhallinta ja renderöinti):** Asteroidien sijainnit vaihtuivat ja arvottiin täysin satunnaisesti uudelleen aina, kun selaimen zoomausta muutettiin tai PHA-suodatin kytkettiin päälle/pois. Koodi siis laski sijainnit uusiksi jokaisella ruudunpäivityksellä.
* **Johtopäätös:** Epäonnistunut. Visuaalinen tyyli oli oikein, mutta tilanhallinta ja renderöintilogiikka vaativat korjausta.

### Korjaus ja uusintatesti
* **Tehty korjaus:** Ohjelmistoarkkitehtuuria ja käyttöliittymää muutettiin merkittävästi. 
  1. Lisättiin HUD-paneeliin erillinen "Scan"-hakupainike (satelliittikuvakkeella). 
  2. Automaattinen API-kysely poistettiin: data haetaan ja asteroidien *sijainnit lasketaan ja lukitaan muistiin vain kerran* painiketta painettaessa. 
  3. Suodattimen (checkbox) klikkaaminen tai ikkunan koon muuttaminen vain piirtää jo kertaalleen tallennetut sijainnit uudelleen uudelleensijoittamatta niitä. 
  4. Sijoittelualgoritmia rajattiin siten, että arvottu säde ei ylitä Canvaksen äärirajoja.
* **Uusintatestin havaittu tulos:** Sovellus ei enää hae dataa automaattisesti, vaan odottaa käyttäjän "Scan"-komentoa (säästää myös API-kutsuja estäen NASA:n timeouteja). Painalluksen jälkeen kaikki 8 asteroidia ilmestyvät ruudulle oikein värikoodattuina eivätkä karkaa ikkunan ulkopuolelle. Kun PHA-suodattimen kytkee päälle, turvalliset pisteet katoavat, mutta vaaralliset pysyvät vakaasti omilla paikoillaan. Myös zoomaaminen on vakaata.
* **Johtopäätös:** **Läpäisty.** Korjaus poisti jatkuvan API-kyselyriskin ja vakautti käyttöliittymän visuaalisen asettelun täydellisesti. Vaatimukset V3 ja V5 toimivat nyt saumattomasti yhteen.

**HUOM: NASA:n rajapinta voi mennä solmuun, jos scan-nappia painaa liian monta kertaa peräkkäin!**

Vaiheen 3 kuva:

<img width="959" height="405" alt="image" src="https://github.com/user-attachments/assets/2b4d57aa-1f3b-4734-a6f8-23b7b6f1cb9f" />

-----------------------------------------------------------------------------------------------------------------------------
