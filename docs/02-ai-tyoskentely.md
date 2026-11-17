# Alkuprompti, käytetyt AI-työkalut ja työskentelyprosessi

# 1. Alkuprompt

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

----------------------------------------------------------------------------------------------------------------------------

# 2. Vaihe 2 Prompt

> Vaihe 1 on valmis ja käyttöliittymän tyylit ovat kunnossa. Siirrytään vaiheeseen 2: NASA NeoWs -rajapinnan datan hakemiseen.

> Tavoite:

> Haluamme hakea kuluvan päivän asteroidiohitukset NeoWs API:sta.

> Tehtävät:

> Kirjoita app.js-tiedostoon uusi asynkroninen funktio fetchNeoData().
> Funktio luo automaattisesti kuluvan päivän päivämäärän (YYYY-MM-DD) ja tekee API-pyynnön NeoWs-rajapinnan 'feed'-päätepisteeseen käyttäen DEMO_KEY-avainta.
> Älä vielä koske Canvas-elementtiin tai koodaa valopisteiden piirtämistä. Keskitytään vain datan hakemiseen.
> Päivitä HTML-infopaneelissa oleva <p id="neo-date"> -elementti näyttämään kuluva päivämäärä ja haettujen asteroidien kokonaislukumäärä (esim. 'Asteroidit (YYYY-MM-DD): 14 kpl').
> Tulosta selaimen konsoliin console.log()-komennolla taulukko tämän päivän asteroideista. Sisällytä tulostukseen kunkin asteroidin nimi, arvioitu koko (kilometriä tai metriä), ohitusetäisyys (kilometriä) sekä boolean-arvo 'is_potentially_hazardous_asteroid'.
> Anna minulle app.js-tiedostoon lisättävät uudet osat ja kerro lyhyesti, mistä polusta NeoWs-rajapinnan JSON-vastauksesta löydät nämä asteroidit.

> Huom. Vaihe 2 keskittyy vaatimukseen V2, mutta se myös luo pohjaa vaatimuksille V4 ja V6. 

## Geminin vastaus pyyntöön: "kerro lyhyesti, mistä polusta NeoWs-rajapinnan JSON-vastauksesta löydät nämä asteroidit."

NASA NeoWs API:n feed-päätepiste palauttaa JSON-objektin, jonka ytimessä on avain nimeltä near_earth_objects. Sen alla data on ryhmitelty päivämäärien mukaan (koska rajapinnasta voi hakea kerralla jopa 7 päivän datan).

Oikea polku päivän asteroideihin (taulukkoon) on siis:data.near_earth_objects["YYYY-MM-DD"]

Yksittäisen asteroidin sisällä tiedot on ripoteltu eri objekteihin:

Nimi ja vaarallisuus: Suoraan asteroidiobjektin juuressa (name ja is_potentially_hazardous_asteroid).

Koko: Syvällä estimated_diameter.meters -objektissa.

Etäisyys: close_approach_data -taulukossa (joka sisältää yleensä vain yhden alkion kyseiselle ohitukselle), sieltä polussa [0].miss_distance.kilometers.

## Geminin antama korjausehdotus promptissa.

**Tapaus: Käyttöliittymäelementtien tarkennus Vaiheessa 2**

Kun ohjeistin tekoälyä rakentamaan Vaiheen 2 (NeoWs-datan haku), olin alun perin suunnitellut datan tulostettavaksi yhteen yksinkertaiseen `<p>`-elementtiin. Koodia generoidessaan tekoäly kuitenkin ehdotti, että aikaleima ja asteroidien lukumäärä kannattaisi erottaa omiin tyylikkäisiin `<span>`-elementteihinsä (`#neo-timestamp` ja `#neo-count`) osaksi HUD-tyyppistä infopaneelia. 

Luin tekoälyn perustelut ja koodiehdotuksen läpi. Koska ehdotus paransi huomattavasti käyttöliittymän "sci-fi"- ja "glassmorphism"-teemaa rikkomatta alkuperäistä vaatimusta V4 (Aikaleimojen esittäminen), annoin tekoälylle luvan lisätä nämä elementit HTML-runkoon jo tässä vaiheessa. 

Tarkistin DOM-päivityksen toimivuuden selaimessa. Kun NeoWs-data oli haettu onnistuneesti, tarkistin Inspect-työkalulla (F12), että JavaScript osasi kohdistaa datan oikein näihin uusiin ID-tunnisteisiin.
---------------------------------------------------------------------------------------------------------------------------
