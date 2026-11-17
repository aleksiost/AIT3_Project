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
<img width="959" height="413" alt="image" src="https://github.com/user-attachments/assets/56430c4d-7289-452f-8aa6-a9f1e3ab8793" />

--------------------------------------------------------------------------------------------------------------------------

## Vaihe 2:
