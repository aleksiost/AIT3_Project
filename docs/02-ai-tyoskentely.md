# Alkuprompti, käytetyt AI-työkalut ja työskentelyprosessi

## 1. Alkuprompt

Käytin koodauksen aloittamiseen seuraavaa alkupromptia, joka pohjautuu suoraan projektikuvauksen vaatimuksiin. Annoin tekoälylle tarkat teknologiat ja pyysin jakamaan työn osiin:

> "Olet kokenut web-kehittäjä. Teen yksisivuisen ohjelmistoprojektin nimeltä 'Lähiavaruuden vahtikoira'.
>
> "Suunnittele käyttöliittymä englanninkieliseksi."
>
> Teknologiat: HTML5, CSS ja Vanilla JavaScript. Käytä erillisiä frameworkeja, kuten React, rajallisesti.
> 
> Tavoite:
> 1. Hakea NASA EPIC API:sta tuorein kuva maapallosta ja asettaa se ruudun keskelle.
> 2. Hakea NASA NeoWs API:sta kuluvan päivän ohittavat asteroidit.
> 3. Visualisoida asteroidit HTML5 Canvas -elementillä maapallon ympärille hohtavina valopisteinä.
> 4. Näyttää käyttöliittymässä datan aikaleimat ja kytkin, jolla voi suodattaa vain vaaralliset (Potentially Hazardous) kohteet.
> 
> Lähdetään liikkeelle vaiheittain.
> **Vaihe 1:** Luo minulle projektin tiedostorakenne (index.html, style.css, app.js) sekä peruskäyttöliittymä, jossa on paikka maapallon kuvalle, infopaneeli aikaleimoille ja suodatuskytkin. Tee myös funktio, joka hakee ja näyttää tuoreimman maapallokuvan EPIC-rajapinnasta (voit käyttää aluksi DEMO_KEY-avainta).
> 
> Älä tee vielä asteroidien hakua tai Canvas-visualisointia, vaan keskitytään ensin Vaiheeseen 1. Anna koodit ja lyhyet ohjeet.
> 
> Lisäyksenä: Pyri jo alussa luomaan käyttöliittymälle ulkoasua, joka näyttää modernilta kuten tällä sivustolla olevat esimerkit: https://reactbits.dev/"

## 2. Käytetyt AI-työkalut

| **Työkalu** | **Malli tai versio** | **Käyttötarkoitus** | **Miten tuotoksia tarkistettiin?** |
| --------- | ------------------ | ----------------- | -------------------------------- |
| Google Gemini | Argon | Ohjelman generointi ja ongelmanratkaisu | Luin koodin ensiksi itse läpi ja sitten ajan koodin selaimessa. |

## 3. Työskentelyprosessi

Koska teen projektin yksin ilman agenttista ympäristöä, prosessini on seuraava:
1. **Kontekstin anto:** Annan AI-työkalulle tehtävän kerrallaan (esim. "Tee seuraavaksi API-haku NeoWs-rajapintaan").
2. **Katselmointi:** En kopioi koodia sokeasti. Luen ehdotetun koodin läpi ja tarkistan, ymmärränkö mitä uudet funktiot tekevät.
3. **Testaus:** Siirrän hyväksytyn koodin tiedostoihini, päivitän selaimen ja avaan selaimen kehitystyökalut (DevTools). Tarkistan, että API-haut menevät läpi (Network-välilehti) eikä Consoleen tule virheitä.
4. **Iterointi:** Jos koodi ei toimi, kerron AI:lle tarkan virheilmoituksen ja pyydän korjausta.
5. **Tallennus:** Kun yksi ominaisuus (esim. kuvan haku) toimii, teen Git commitin.

## 4. Esimerkki AI-tuotoksen tarkistamisesta ja korjaamisesta
