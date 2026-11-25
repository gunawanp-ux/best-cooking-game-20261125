DAPUR KILAT — Warung Rush
============================

An original browser cooking game built for the make.fun "best cooking game"
bounty. No libraries, no network requests, no build step: open game/index.html
in a desktop browser and play.

THE GAME
--------
You run a small warung burger kitchen during the lunch rush. Order tickets
slide onto the rail at the top of the kitchen, each with a patience bar.
Build every burger exactly as ordered and serve it before the customer
walks away.

How a burger gets made:
  1. Grab ingredients from the counter crates (bun, beef, tomato, lettuce,
     cheese, sauce) — click a crate, or press keys 1-6.
  2. Tomato and lettuce must be chopped on the cutting board first.
  3. Beef goes on the grill: it cooks over a few seconds, then you must grab
     it before it burns.
  4. Stack everything on the assembly plate in any order, then ring the
     service bell to serve the matching ticket.

You carry one thing at a time, so every order is a little route-planning
puzzle through the kitchen: chop while the patty grills, stack while the
next ticket arrives.

Scoring and pressure:
  - Serve a correct burger: points plus a time bonus, and your combo grows.
  - Serve the wrong burger or let a ticket expire: combo resets, points lost.
  - Every 5 served burgers the lunch rush speeds up: tickets arrive faster
    and patience drains quicker, and fancier burgers appear on the menu.
  - One shift lasts 150 seconds. Beat your best score, then play again.

Controls:
  Mouse: click crates, board, grill, plate, bell and bin.
  Keys:  1 bun, 2 beef, 3 tomato, 4 lettuce, 5 cheese, 6 sauce,
         C chopping board, G grill, A assembly plate, S serve, T trash,
         P pause, Enter start / restart, M mute.

Screenshots in screenshots/ were taken from the game's own code running in
headless Chromium. The game also accepts a demo query for staging shots,
for example game/index.html?demo=mid — normal play never needs it.

FILES
-----
  main.ts                  Node 22 program that hands the entry in: it copies
                           game/ and screenshots/ to the output directory and
                           writes dossier.json with vendor/makefun-game.ts.
  vendor/makefun-game.ts   The make.fun dossier library, copied from the kit
                           unchanged.
  game/index.html          Page shell: canvas, styles, module bootstrap.
  game/style.css           Page and canvas presentation.
  game/src/main.js         Boot, game loop, screens, shift timer, scoring.
  game/src/recipes.js      The menu: burgers, ingredients, order generation.
  game/src/kitchen.js      Kitchen state and every player action: picking up,
                           chopping, grilling, assembling, serving, trashing.
  game/src/render.js       All canvas drawing: kitchen, tickets, counters,
                           food, chef, particles and popups.
  game/src/audio.js        Tiny WebAudio synth: chops, sizzles, dings.
  game/src/input.js        Mouse and keyboard mapping onto kitchen actions.
  screenshots/             4 real renders of the game.
