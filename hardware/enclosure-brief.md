# Cahier des charges, cadre bois QuietDash

Fiche technique à envoyer aux ateliers (découpe numérique, CNC, ébénistes) pour demande de
devis prototype et petite série. Voir aussi `DECISIONS.md` (D10).

Note importante : les cotes ci-dessous sont les valeurs catalogue/typiques. Elles sont à
confirmer sur le matériel réel avant production finale (un panneau et un Pi seront mesurés au
pied à coulisse, et un STL/DXF fourni à l'atelier).

## Le produit

QuietDash est un petit afficheur e-ink calme posé sur un bureau. Il faut un cadre bois qui
loge un écran e-paper 7,5 pouces et l'électronique derrière, avec une fenêtre propre sur la
zone d'affichage, une sortie d'alimentation, et une bonne tenue sur un bureau (incliné).

L'objet doit être beau et sobre, pas un boîtier technique. Bois naturel, finition soignée,
arêtes douces. Référence d'esprit : objet de bureau calme, papier, artisanal.

## Composants à intégrer

1. Dalle e-paper Waveshare 7,5" V2 (noir et blanc)
   - Encombrement dalle : 170,2 x 111,2 x 1,18 mm (source : spec officielle Waveshare V2)
   - Zone d'affichage active (la fenêtre visible) : 163,2 x 97,92 mm
   - Poids : environ 44 g
   - Dalle fine et fragile (verre sur support), la nappe FPC souple sort d'un bord et part
     vers la carte driver

2. Carte driver e-paper (HAT)
   - Environ 65 x 30,5 mm (à confirmer sur le matériel, non vérifiée en source officielle)
   - Reçoit la nappe FPC et se connecte au Pi par le port 40 broches

3. Raspberry Pi Zero 2 W
   - 65 x 30 x 5 mm (carte nue)
   - Environ 12 mm de hauteur avec le connecteur 40 broches soudé
   - Port d'alimentation USB-C (micro-USB selon révision) sur un bord, à rendre accessible

4. Stack électronique derrière la dalle (driver + Pi empilés)
   - Emprise au sol environ 70 x 35 mm
   - Profondeur totale derrière la dalle, prévoir 18 à 22 mm
   - Léger jeu pour câbles et dissipation

## Contraintes de conception

- Fenêtre d'affichage : ouverture nette alignée sur la zone active (163 x 98 mm), avec un
  léger recouvrement du cadre sur le pourtour de la dalle pour la maintenir (feuillure).
- Maintien de la dalle : la dalle est fine et fragile, prévoir une feuillure ou un cadre
  intérieur qui la plaque sans contrainte sur le verre.
- Cavité arrière : loger le stack driver + Pi (70 x 35 mm, profondeur 18 à 22 mm), avec
  passage de la nappe FPC depuis le bord de la dalle.
- Accès alimentation : découpe ou passage pour le câble USB-C, idéalement discret (arrière
  ou dessous).
- Aération : quelques évents discrets si possible (le Pi chauffe peu mais reste allumé en
  continu).
- Tenue bureau : objet incliné, soit un pied/chevalet intégré (angle visé environ 15 degrés),
  soit un socle. Stable, ne glisse pas.
- Accès maintenance : un fond démontable (panneau arrière vissé ou clipsé) pour accéder au Pi
  sans casser le cadre.
- Pas de vis apparentes en façade. Aspect avant le plus pur possible.

## Matériaux et finition

- Prototype : contreplaqué bouleau (couches empilées pour créer la cavité), brut.
- Série finie : bois massif au choix (chêne, noyer, ou hêtre), finition huilée ou cire
  naturelle, mate.
- À éviter : vernis brillant, plastique apparent, aspect "gadget".

## Quantités demandées pour le devis

- 1 prototype (validation géométrie et ergonomie).
- Petite série indicative : 10 à 25 pièces, pour estimer l'effet d'échelle.

## Livrables attendus de l'atelier

- Devis prototype et devis série (10 à 25).
- Délais indicatifs.
- Contraintes éventuelles sur la géométrie (rayons mini, épaisseurs mini, tolérances).
- Formats de fichiers attendus (DXF, STEP, STL) pour qu'on fournisse le bon modèle.

---

## Mail type de demande de devis

Objet : Devis cadre bois sur mesure pour un petit afficheur de bureau

Bonjour,

Je fabrique QuietDash, un petit afficheur e-ink à poser sur un bureau : un écran e-paper de
7,5 pouces en noir et blanc, piloté par un Raspberry Pi. Il me manque le cadre bois qui tient
l'écran et cache l'électronique derrière, et je cherche un atelier en France pour le faire.

Je le veux sobre, en bois naturel, finition mate, rien de tape-à-l'oeil. Côté technique : une
fenêtre nette sur l'écran, une petite cavité à l'arrière pour loger la carte et le Pi (à peu
près 70 x 35 mm, 18 à 22 mm de profondeur), une sortie d'alimentation discrète, un fond qu'on
peut rouvrir, et un léger angle pour qu'il tienne posé sur le bureau. L'écran fait environ
170 x 111 mm, la partie visible 163 x 98 mm.

Je joins une fiche avec toutes les cotes. Pour l'instant j'aimerais surtout savoir votre prix
pour un prototype, une idée du prix sur une petite série (disons 10 à 25 pièces), vos délais,
et les fichiers que vous préférez recevoir (DXF, STEP, STL). Je peux fournir le modèle 3D, et
passer à l'atelier ou vous montrer le matériel si c'est plus simple.

Est-ce que c'est le genre de pièce que vous prenez ? Si oui, on en discute quand vous voulez.

Merci,
Florent
