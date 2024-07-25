/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const dune_stanza = ($, name, field_parser) =>
  seq("(", alias(name, $.stanza_name), repeat(field_parser), ")");
const dune_field = ($, name, value) =>
  seq("(", alias(name, $.field_name), value, ")");

const PREC = { COMMENT: 0, STRING: 1 };

module.exports = grammar({
  name: "dune",

  extras: ($) => [$.comment, /\s+/],

  rules: {
    source_file: ($) => repeat($.stanza),
    sexp: ($) => choice($._atom_or_qs, $.list),
    sexps1: ($) => repeat1($.sexp),
    _atom_or_qs: ($) => choice($.atom, $.quoted_string, $.multiline_string),
    quoted_string: ($) => seq('"', repeat($._quoted_string_char), '"'),
    multiline_string: ($) => seq('"\\|', /.*/, "\n"),
    _quoted_string_char: ($) =>
      token.immediate(
        prec(
          PREC.STRING,
          choice(/[^\\"]/, seq("\\", choice("n", "\n", "r", '"', "\\"))),
        ),
      ),
    atom: ($) => /[^;()"\s]+/,
    list: ($) => seq("(", repeat($.sexp), ")"),
    comment: ($) => token(prec(PREC.COMMENT, /;.*/)),
    stanza: ($) =>
      choice($._stanza_executable, $._stanza_rule, $._stanza_library, $.sexp),
    _stanza_executable: ($) =>
      dune_stanza($, "executable", choice($._field_buildable, $.sexp)),
    _field_buildable: ($) =>
      choice(
        dune_field($, "name", $.module_name),
        dune_field($, "public_name", $.public_name),
        dune_field($, "libraries", repeat($._lib_dep)),
      ),
    _lib_dep: ($) =>
      choice($.library_name, dune_field($, "re_export", $.library_name)),
    library_name: ($) => alias($._atom_or_qs, "library_name"),
    public_name: ($) => alias($._atom_or_qs, "public_name"),
    module_name: ($) => alias($._atom_or_qs, "module_name"),
    _stanza_rule: ($) =>
      dune_stanza(
        $,
        "rule",
        choice(
          dune_field($, "mode", $.sexp),
          dune_field($, "target", $._atom_or_qs),
          dune_field($, "deps", $.sexps1),
          dune_field($, "action", $.action),
          $.sexp,
        ),
      ),
    field_name: ($) => $._atom_or_qs,
    action: ($) => $.sexp,
    _stanza_library: ($) =>
      dune_stanza(
        $,
        "library",
        choice(
          $._field_buildable,
          dune_field($, "synopsis", $._atom_or_qs),
          dune_field($, "instrumentation", $.sexp),
          $.sexp,
        ),
      ),
  },
});
