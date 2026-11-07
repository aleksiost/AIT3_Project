# Projektin nimi ja määrittely: Lähiavaruuden vahtikoira (Near Earth Dashboard)

## Käyttäjä, tarve ja hyöty

Sovellus on suunnattu avaruusilmiöistä ja tähtitieteestä kiinnostuneille harrastajille (kuten minulle itselleni). Ongelmana on, että NASA:n tarjoama data Maan ohittavista asteroideista on luettavissa vain kuivina numeroina taulukoista, joista on vaikea hahmottaa mittasuhteita tai tilanteen kokonaiskuvaa. 

Hyötynä sovellus yhdistää aidon satelliittikuvan maapallosta ja visualisoi sen ympärille tuoreimmat ohittavat asteroidit. Käyttäjä näkee yhdellä silmäyksellä, kuinka paljon liikennettä lähiavaruudessa on, ja voi visuaalisesti erottaa potentiaalisesti vaaralliset kohteet.

## Käyttäjäskenaariot

1. **Päivittäinen tilannekatsaus:** Käyttäjä avaa sovelluksen. Ohjelma hakee NASA:n EPIC-rajapinnasta tuoreimman saatavilla olevan maapallokuvan ja näyttää sen keskellä ruutua. Sen ympärille ilmestyy hohtavia valopisteitä, joiden lukumäärä vastaa nykyhetken/kuluvan päivän asteroidiohituksia (NeoWs-rajapinta). Käyttöliittymässä on selkeä infokenttä, joka kertoo kummankin datan tarkan aikaleiman.
2. **Kohteiden vertailu ja tarkastelu:** Käyttäjä näkee maapallon ympärillä useita valopisteitä. Hän vie hiiren yksittäisen valopisteen päälle, jolloin ohjelma näyttää infolaatikossa kyseisen asteroidin nimen, nopeuden, arvioidun koon ja tarkan ohitusetäisyyden.
3. **Vaarallisten kohteiden suodatus:** Käyttäjä haluaa nähdä vain merkittävimmät uhkat. Hän aktivoi "Näytä vain vaaralliset" -suodattimen, jolloin tavalliset valopisteet katoavat ja näytölle jäävät vain NASA:n "Potentially Hazardous" -luokittelemat kohteet.

## Vaatimukset ja hyväksymiskriteerit

| Tunniste | Vaatimus | Hyväksymiskriteeri | Prioriteetti |
|---|---|---|---|
| V1 | Maapallon kuvan haku (EPIC) | Sovellus näyttää onnistuneesti NASA:n EPIC-rajapinnasta haetun tuoreimman kuvan käyttöliittymän keskellä. | Korkea |
| V2 | Asteroididatan haku (NeoWs) | Sovellus hakee onnistuneesti kuluvan päivän asteroididata (nimet, koot, etäisyydet, vaarallisuus) ja tallentaa sen muuttujiin. | Korkea |
| V3 | Visuaalinen esittäminen (Valopisteet) | Haettu asteroididata generoidaan maapallon ympärille valopisteinä ja -janoina, joiden lukumäärä vastaa rajapinnan palauttamaa määrää. | Korkea |
| V4 | Aikaleimojen esittäminen | Käyttöliittymässä on selkeä kenttä, joka näyttää erikseen maapallon kuvan ja asteroidihavaintojen aikaleimat (esim. pvm ja klo). | Keski |
| V5 | Datan suodatus | Käyttäjä voi kytkimellä piilottaa kohteet, jotka eivät ole potentiaalisesti vaarallisia. Piilotetut valopisteet katoavat. | Keski |
| V6 | Virheiden hallinta | Jos rajapinta ei vastaa (esim. API-raja ylitetty), sovellus ei kaadu, vaan näyttää selkeän virheilmoituksen. | Keski |

## Rajaus

* **Toteutettava vähimmäiskokonaisuus:** Yksisivuinen web-sovellus, joka hakee tuoreimman EPIC-kuvan ja nykyhetken NeoWs-datan. Sisältää valopistevisualisoinnin, aikaleimojen näytön ja vaarallisuussuodattimen.
* **Ulkopuolelle jätettävät asiat:** Datan pakotettu synkronointi samalle päivämäärälle jätetään pois. Fyysinen 1:1 mittakaava ja monimutkaiset 3D-kiertoratasimulaatiot jätetään pois.
* **Työskentely:** Teen projektin yksin, joten pariohjelmointiin tai työnjakoon liittyviä käytänteitä ei sovelleta.

## Toteutuksen rakenne, oletukset ja riskit

* **Rakenne:** selainpohjainen HTML/CSS/JavaScript-sovellus. Valopisteiden ja valojanojen piirtämiseen hyödynnetään HTML5 Canvas -elementtiä tai CSS-animaatioita.
* **Datalähteet:** NASA EPIC API (satelliittikuvat) ja NASA Asteroid NeoWs API. 
* **Oletukset:** Oletamme, että käyttäjä ymmärtää avaruusdatan luonteen aikaleimojen perusteella (satelliittikuva voi olla eiliseltä, asteroididata täydentyy livenä). 
* **Riskit:** Valopisteiden satunnainen sijoittelu ruudulle niin, että ne asettuvat järkevästi maapallokuvan ympärille (eivätkä sen taakse/päälle piiloon tai liian kauas).

## Merkittävät muutokset ja perustelut

* **Määrittelyvaihe (Marraskuu 2026):** Päätettiin luopua EPIC-kuvan ja NeoWs-asteroididatan pakotetusta päivämääräsynkronoinnista. EPIC-kuvat laahaavat usein päiviä jäljessä, mikä olisi tehnyt koodin logiikasta hauraan ja estänyt "tämän päivän" asteroidien katselun. Ratkaisuna näytetään molempien tuorein data erillisine aikaleimoineen (Vaatimus V4). Tämä on käyttäjälle läpinäkyvämpää ja teknisesti luotettavampaa.
