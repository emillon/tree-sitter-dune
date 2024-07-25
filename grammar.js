/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const dune_stanza = ($, name, field_parser) =>
  seq("(", alias(name, $.stanza_name), repeat(field_parser), ")");

const dune_field = ($, name, value) =>
  seq("(", alias(name, $.field_name), value, ")");

const dune_osl = (element, self) =>
  choice(repeat1(element), seq("(", optional(self), ")"));

const dune_action = ($, name) =>
  seq("(", alias(name, $.action_name), repeat($.sexp), ")");

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
    multiline_string: ($) => /"\\[\|>].*\n/,
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
        dune_field($, "modules", optional($._modules_osl)),
      ),
    _modules_osl: ($) => dune_osl($.module_name, $._modules_osl),
    _lib_dep: ($) =>
      choice(
        $.library_name,
        dune_field($, "re_export", $.library_name),
        dune_field($, "select", $.sexps1),
      ),
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
    action: ($) =>
      choice(
        dune_action($, "bash"),
        dune_action($, "cat"),
        dune_action($, "chdir"),
        dune_action($, "copy"),
        dune_action($, "copy#"),
        dune_action($, "diff"),
        dune_action($, "echo"),
        dune_action($, "no-infer"),
        dune_action($, "progn"),
        dune_action($, "run"),
        dune_action($, "system"),
        dune_action($, "with-outputs-to"),
        dune_action($, "with-stdout-to"),
        dune_action($, "write-file"),
      ),
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
