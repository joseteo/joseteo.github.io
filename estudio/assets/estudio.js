/* ==========================================================================
   Taller de Estudio — teaching tools
   Everything runs in the page. No accounts, no storage, no tracking.
   ========================================================================== */

(function () {
  'use strict';

  var calculators = {};
  var figures = {};

  /* ------------------------------------------------------------ helpers */

  function num(value, fallback) {
    var n = parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(n) ? n : fallback;
  }

  function fmt(value, digits) {
    if (!Number.isFinite(value)) return '—';
    var d = typeof digits === 'number' ? digits : 2;
    var abs = Math.abs(value);
    if (abs !== 0 && (abs >= 1e6 || abs < 1e-3)) {
      return value.toExponential(2).replace('e', ' · 10^');
    }
    return value.toLocaleString('es-ES', {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  /* ------------------------------------------------------------ progress + toc */

  function initProgress() {
    var bar = document.querySelector('.progress');
    if (!bar) return;
    var update = function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0;
      bar.style.width = pct + '%';
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  function initToc() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;

    var map = {};
    var targets = [];
    links.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (!section) return;
      map[id] = link;
      targets.push(section);
    });

    var visible = {};

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          visible[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        });
        var bestId = null;
        var best = 0;
        Object.keys(visible).forEach(function (id) {
          if (visible[id] > best) {
            best = visible[id];
            bestId = id;
          }
        });
        if (!bestId) return;
        links.forEach(function (link) {
          link.removeAttribute('aria-current');
        });
        if (map[bestId]) map[bestId].setAttribute('aria-current', 'true');
      },
      { rootMargin: '-15% 0px -60% 0px', threshold: [0, 0.15, 0.4, 0.75] }
    );

    targets.forEach(function (t) {
      observer.observe(t);
    });
  }

  /* ------------------------------------------------------------ calculators */

  function initCalculators() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-calc]'));
    nodes.forEach(function (root) {
      var name = root.getAttribute('data-calc');
      var fn = calculators[name];
      if (typeof fn !== 'function') return;

      var outRoot = root.querySelector('[data-out]');
      if (!outRoot) return;

      var inputs = Array.prototype.slice.call(root.querySelectorAll('[data-in]'));

      function read() {
        var values = {};
        inputs.forEach(function (input) {
          var key = input.getAttribute('data-in');
          values[key] = input.tagName === "SELECT" ? input.value : num(input.value, NaN);
        });
        return values;
      }

      function render() {
        var values = read();
        var results;
        try {
          results = fn(values);
        } catch (err) {
          results = [{ label: 'Revisa los datos', text: 'Hay un valor fuera de rango.', tone: 'bad', wide: true }];
        }
        if (!Array.isArray(results)) return;

        outRoot.textContent = '';
        results.forEach(function (item) {
          if (!item) return;
          var box = el('div', 'out' + (item.wide ? ' out--wide' : '') + (item.tone ? ' out--verdict' : ''));
          box.appendChild(el('span', 'out__label', item.label || ''));

          if (item.tone) {
            var badge = el('span', 'verdict verdict--' + item.tone, item.text || '');
            var wrap = el('span', 'out__value');
            wrap.appendChild(badge);
            box.appendChild(wrap);
          } else {
            var value = el('span', 'out__value', fmt(item.value, item.digits));
            if (item.unit) value.appendChild(el('small', null, item.unit));
            box.appendChild(value);
          }
          outRoot.appendChild(box);
        });
      }

      inputs.forEach(function (input) {
        input.addEventListener('input', render);
        input.addEventListener('change', render);
      });
      render();
    });
  }

  /* ------------------------------------------------------------ live figures */

  function initFigures() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll('[data-figure]'));
    nodes.forEach(function (root) {
      var name = root.getAttribute('data-figure');
      var fn = figures[name];
      if (typeof fn !== 'function') return;

      var inputs = Array.prototype.slice.call(root.querySelectorAll('[data-in]'));
      var outputs = Array.prototype.slice.call(root.querySelectorAll('output[data-out]'));

      function render() {
        var values = {};
        inputs.forEach(function (input) {
          values[input.getAttribute('data-in')] = num(input.value, 0);
        });
        outputs.forEach(function (output) {
          var key = output.getAttribute('data-out');
          if (key in values) output.textContent = fmt(values[key], 0);
        });
        try {
          fn(root, values);
        } catch (err) {
          /* a figure must never break the page */
        }
      }

      inputs.forEach(function (input) {
        input.addEventListener('input', render);
      });
      render();
    });
  }

  /* ------------------------------------------------------------ flashcards */

  function initFlashcards() {
    var decks = Array.prototype.slice.call(document.querySelectorAll('[data-flash]'));

    decks.forEach(function (deck) {
      var cards = Array.prototype.slice.call(deck.querySelectorAll('.flashcard'));
      if (!cards.length) return;

      var counter = deck.querySelector('[data-count]');
      var dotsRoot = deck.querySelector('[data-dots]');
      var prev = deck.querySelector('[data-prev]');
      var next = deck.querySelector('[data-next]');
      var shuffle = deck.querySelector('[data-shuffle]');
      var index = 0;
      var order = cards.map(function (_, i) {
        return i;
      });

      function paint() {
        cards.forEach(function (card, i) {
          var active = order[index] === i;
          card.hidden = !active;
          if (!active) card.setAttribute('aria-expanded', 'false');
        });
        if (counter) counter.textContent = index + 1 + ' / ' + cards.length;
        if (dotsRoot) {
          Array.prototype.slice.call(dotsRoot.children).forEach(function (dot, i) {
            if (i === index) dot.setAttribute('aria-current', 'true');
            else dot.removeAttribute('aria-current');
          });
        }
        if (prev) prev.disabled = index === 0;
        if (next) next.disabled = index === cards.length - 1;
      }

      function go(delta) {
        var target = index + delta;
        if (target < 0 || target >= cards.length) return;
        index = target;
        paint();
      }

      if (dotsRoot) {
        dotsRoot.textContent = '';
        cards.forEach(function (_, i) {
          var dot = el('button');
          dot.type = 'button';
          dot.setAttribute('aria-label', 'Tarjeta ' + (i + 1));
          dot.addEventListener('click', function () {
            index = i;
            paint();
          });
          dotsRoot.appendChild(dot);
        });
      }

      cards.forEach(function (card) {
        card.addEventListener('click', function () {
          var open = card.getAttribute('aria-expanded') === 'true';
          card.setAttribute('aria-expanded', open ? 'false' : 'true');
        });
      });

      if (prev) prev.addEventListener('click', function () { go(-1); });
      if (next) next.addEventListener('click', function () { go(1); });

      if (shuffle) {
        shuffle.addEventListener('click', function () {
          for (var i = order.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = order[i];
            order[i] = order[j];
            order[j] = tmp;
          }
          index = 0;
          paint();
        });
      }

      deck.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          go(1);
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          go(-1);
        }
      });

      paint();
    });
  }

  /* ------------------------------------------------------------ quiz */

  function initQuiz() {
    var roots = Array.prototype.slice.call(document.querySelectorAll('[data-quiz]'));

    roots.forEach(function (root) {
      var sourceId = root.getAttribute('data-quiz');
      var source = document.getElementById(sourceId);
      if (!source) return;

      var questions;
      try {
        questions = JSON.parse(source.textContent);
      } catch (err) {
        return;
      }
      if (!Array.isArray(questions) || !questions.length) return;

      var qEl = root.querySelector('[data-q]');
      var optsEl = root.querySelector('[data-opts]');
      var stepEl = root.querySelector('[data-step]');
      var scoreEl = root.querySelector('[data-score]');
      var feedback = root.querySelector('[data-feedback]');
      var nextBtn = root.querySelector('[data-next]');
      var bar = root.querySelector('[data-bar]');
      var result = root.querySelector('[data-result]');
      var body = root.querySelector('[data-body]');
      var review = root.querySelector('[data-review]');
      var retry = root.querySelector('[data-retry]');
      var again = root.querySelector('[data-again]');

      var queue = [];
      var index = 0;
      var score = 0;
      var missed = [];
      var locked = false;

      function start(list) {
        queue = list.slice();
        index = 0;
        score = 0;
        missed = [];
        if (result) result.hidden = true;
        if (body) body.hidden = false;
        if (review) review.textContent = '';
        paint();
      }

      function paint() {
        locked = false;
        var item = queue[index];
        if (!item) return;

        if (qEl) qEl.textContent = item.q;
        if (stepEl) stepEl.textContent = 'Pregunta ' + (index + 1) + ' de ' + queue.length;
        if (scoreEl) scoreEl.textContent = 'Aciertos ' + score + ' / ' + queue.length;
        if (bar) bar.style.width = (index / queue.length) * 100 + '%';
        if (feedback) {
          feedback.hidden = true;
          feedback.className = 'quiz__feedback';
          feedback.textContent = '';
        }
        if (nextBtn) {
          nextBtn.disabled = true;
          nextBtn.textContent = index + 1 === queue.length ? 'Ver resultado' : 'Siguiente';
        }

        optsEl.textContent = '';
        var letters = ['A', 'B', 'C', 'D', 'E'];
        item.opts.forEach(function (text, i) {
          var li = el('li');
          var btn = el('button', 'quiz__opt');
          btn.type = 'button';
          btn.appendChild(el('span', 'quiz__key', letters[i] || String(i + 1)));
          btn.appendChild(el('span', null, text));
          btn.addEventListener('click', function () {
            answer(i, btn);
          });
          li.appendChild(btn);
          optsEl.appendChild(li);
        });
      }

      function answer(choice, btn) {
        if (locked) return;
        locked = true;
        var item = queue[index];
        var correct = choice === item.answer;
        if (correct) score += 1;
        else missed.push(item);

        Array.prototype.slice.call(optsEl.querySelectorAll('.quiz__opt')).forEach(function (option, i) {
          option.disabled = true;
          if (i === item.answer) option.classList.add('is-correct');
          else if (i === choice) option.classList.add('is-wrong');
          else option.classList.add('is-muted');
        });

        if (feedback) {
          feedback.hidden = false;
          feedback.className = 'quiz__feedback ' + (correct ? 'is-ok' : 'is-no');
          feedback.appendChild(el('b', null, correct ? 'Correcto' : 'No exactamente'));
          feedback.appendChild(document.createTextNode(item.why || ''));
        }

        if (scoreEl) scoreEl.textContent = 'Aciertos ' + score + ' / ' + queue.length;
        if (nextBtn) nextBtn.disabled = false;
      }

      function finish() {
        if (body) body.hidden = true;
        if (result) result.hidden = false;
        var pct = Math.round((score / queue.length) * 100);
        var scoreBox = root.querySelector('[data-final]');
        if (scoreBox) {
          scoreBox.textContent = '';
          scoreBox.appendChild(document.createTextNode(String(score)));
          scoreBox.appendChild(el('span', null, ' / ' + queue.length));
        }
        var msg = root.querySelector('[data-msg]');
        if (msg) {
          msg.textContent =
            pct === 100
              ? 'Redondo. Puedes pasar al siguiente bloque sin repasar este.'
              : pct >= 70
                ? 'Buen control. Repasa las falladas y vuelve en un par de días.'
                : 'Todavía no. Vuelve al formulario y a los ejemplos resueltos antes de repetir.';
        }
        if (review) {
          review.textContent = '';
          if (!missed.length) {
            review.appendChild(el('li', null, 'Sin fallos. Nada que repasar.'));
          } else {
            missed.forEach(function (item) {
              var li = el('li');
              li.appendChild(el('b', null, 'Repasa: '));
              li.appendChild(document.createTextNode(item.q));
              review.appendChild(li);
            });
          }
        }
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          if (index + 1 >= queue.length) {
            finish();
            return;
          }
          index += 1;
          paint();
        });
      }

      if (retry) {
        retry.addEventListener('click', function () {
          start(questions);
        });
      }

      if (again) {
        again.addEventListener('click', function () {
          if (!missed.length) {
            start(questions);
            return;
          }
          start(missed.slice());
        });
      }

      start(questions);
    });
  }

  /* ------------------------------------------------------------ drills */

  function initDrills() {
    var drills = Array.prototype.slice.call(document.querySelectorAll('[data-drill]'));

    drills.forEach(function (root) {
      var input = root.querySelector('.drill__input');
      var check = root.querySelector('[data-check]');
      var show = root.querySelector('[data-show]');
      var fb = root.querySelector('[data-fb]');
      var answer = num(root.getAttribute('data-answer'), NaN);
      var tol = num(root.getAttribute('data-tol'), 0.01);
      var solution = root.getAttribute('data-solution') || '';

      function say(text, tone) {
        if (!fb) return;
        fb.textContent = text;
        fb.className = 'drill__fb' + (tone ? ' is-' + tone : '');
      }

      if (check) {
        check.addEventListener('click', function () {
          if (!input) return;
          var value = num(input.value, NaN);
          if (!Number.isFinite(value)) {
            say('Escribe un número para comprobar.', '');
            return;
          }
          if (!Number.isFinite(answer)) return;
          var diff = Math.abs(value - answer);
          if (diff <= tol) {
            say('Correcto. ' + (solution ? solution : ''), 'ok');
          } else if (diff <= tol * 4) {
            say('Casi: revisa redondeos y unidades. La respuesta exacta es ' + fmt(answer, 3) + '.', '');
          } else {
            say('No es ese valor. Vuelve al formulario y comprueba las unidades.', 'no');
          }
        });
      }

      if (show) {
        show.addEventListener('click', function () {
          say('Solución: ' + fmt(answer, 3) + (solution ? ' · ' + solution : ''), '');
        });
      }

      if (input) {
        input.addEventListener('keydown', function (event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            if (check) check.click();
          }
        });
      }
    });
  }

  /* ------------------------------------------------------------ print */

  function initPrint() {
    Array.prototype.slice.call(document.querySelectorAll('[data-print]')).forEach(function (btn) {
      btn.addEventListener('click', function () {
        window.print();
      });
    });
  }

  /* En móvil la barra de asignaturas se desplaza en horizontal: deja visible
     la asignatura actual sin mover la página. */
  function initBarScroll() {
    var nav = document.querySelector('.bar__nav');
    if (!nav) return;
    var active = nav.querySelector('[aria-current="page"]');
    if (!active) return;

    var apply = function () {
      var navRect = nav.getBoundingClientRect();
      var actRect = active.getBoundingClientRect();
      if (actRect.left >= navRect.left && actRect.right <= navRect.right) return;
      nav.scrollLeft += actRect.left - navRect.left - 12;
    };

    apply();
    window.addEventListener('load', apply);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  }

  /* ------------------------------------------------------------ boot */

  function boot() {
    initProgress();
    initToc();
    initCalculators();
    initFigures();
    initFlashcards();
    initQuiz();
    initDrills();
    initPrint();
    initBarScroll();
  }

  window.Estudio = {
    calculator: function (name, fn) {
      calculators[name] = fn;
    },
    figure: function (name, fn) {
      figures[name] = fn;
    },
    fmt: fmt,
    num: num,
  };

  if (document.readyState === 'loading' || document.readyState === 'interactive') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    window.setTimeout(boot, 0);
  }
})();
