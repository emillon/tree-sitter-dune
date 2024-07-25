/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const dune_stanza = ($, name, field_parser) =>
  seq("(", alias(name, $.stanza_name), repeat(field_parser), ")");
const dune_field = ($, name, value) =>
  seq("(", alias(name, $.field_name), value, ")");

module.exports = grammar({
  name: "dune",

  rules: {
    source_file: ($) => repeat($.stanza),
    sexp: ($) => choice($._atom_or_qs, $.list),
    _atom_or_qs: ($) => choice($.atom, $.quoted_string),
    quoted_string: ($) => seq('"', repeat($._quoted_string_char), '"'),
    _quoted_string_char: ($) =>
      choice(/[a-z]/, /[A-Z]/, /[,!%{}_=]/, "|", "/", ".", "\\n", " "),
    atom: ($) => /[a-zA-Z_%.:/{}|=\\,\-!#]+/,
    list: ($) => seq("(", repeat($.sexp), ")"),
    stanza: ($) =>
      choice($._stanza_executable, $._stanza_rule, $._stanza_library, $.sexp),
    _stanza_executable: ($) =>
      dune_stanza($, "executable", $._field_executable),
    _field_executable: ($) =>
      choice(
        $._field_executable_name,
        $._field_executable_public_name,
        $._field_executable_libraries,
      ),
    _field_executable_name: ($) => dune_field($, "name", $.module_name),
    _field_executable_public_name: ($) =>
      dune_field($, "public_name", $.public_name),
    _field_executable_libraries: ($) =>
      dune_field($, "libraries", repeat($.library_name)),
    library_name: ($) => alias($._atom_or_qs, "library_name"),
    public_name: ($) => alias($._atom_or_qs, "public_name"),
    module_name: ($) => alias($._atom_or_qs, "module_name"),
    _stanza_rule: ($) => dune_stanza($, "rule", $.field_rule),
    field_name: ($) => $._atom_or_qs,
    field_rule: ($) =>
      choice(
        $.field_rule_mode,
        $.field_rule_target,
        $.field_rule_deps,
        $.field_rule_action,
        $.sexp,
      ),
    field_rule_mode: ($) => dune_field($, "mode", $.sexp),
    field_rule_target: ($) => dune_field($, "target", $._atom_or_qs),
    field_rule_deps: ($) => dune_field($, "deps", $.sexp),
    field_rule_action: ($) => dune_field($, "action", $.action),
    action: ($) => $.sexp,
    _stanza_library: ($) =>
      dune_stanza(
        $,
        "library",
        choice(
          $._field_library_name,
          $._field_library_libraries,
          dune_field($, "synopsis", $._atom_or_qs),
          dune_field($, "instrumentation", $.sexp),
        ),
      ),
    _field_library_name: ($) => dune_field($, "name", $.module_name),
    _field_library_libraries: ($) =>
      dune_field($, "libraries", repeat($.library_name)),
  },
});
