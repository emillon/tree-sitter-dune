/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const wrap = (...a) => seq("(", ...a, ")");

const dune_stanza = ($, name, field_parser) =>
  wrap(alias(name, $.stanza_name), repeat(field_parser));

const dune_field = ($, name, value) => wrap(alias(name, $.field_name), value);

const dune_osl = (element, self) =>
  choice(repeat1(element), wrap(optional(self)));

const dune_action = ($, name, value) => wrap(alias(name, $.action_name), value);

const PREC = { COMMENT: 0, STRING: 1 };

const atom_regexp = /[^;()"\s]+/;

const seq_regexp = (a, b) => new RegExp(a.source + b.source);

module.exports = grammar({
  name: "dune",

  extras: ($) => [$.comment, /\s+/],

  rules: {
    source_file: ($) => choice($.ocaml_syntax, repeat($.stanza)),
    ocaml_syntax: ($) => seq("(* -*- tuareg -*- *)", repeat(/.+/)),
    sexp: ($) => choice($._atom_or_qs, $._list),
    sexps1: ($) => repeat1($.sexp),
    _atom_or_qs: ($) => choice($._atom, $.quoted_string, $.multiline_string),
    quoted_string: ($) => seq('"', repeat($._quoted_string_char), '"'),
    multiline_string: ($) => /("\\[\|>].*\n\s*)+/,
    _quoted_string_char: ($) =>
      token.immediate(
        prec(
          PREC.STRING,
          choice(/[^\\"]/, seq("\\", choice("n", "\n", "r", '"', "\\"))),
        ),
      ),
    _atom: ($) => atom_regexp,
    named_variable: ($) => seq_regexp(/:/, atom_regexp),
    _list: ($) => wrap(repeat($.sexp)),
    comment: ($) => token(prec(PREC.COMMENT, /;.*/)),
    stanza: ($) =>
      choice(
        $._stanza_executable,
        $._stanza_rule,
        $._stanza_library,
        dune_stanza($, "vendored_dirs", $.sexp),
        $._stanza_alias,
        dune_stanza($, "ocamllex", $._field_modules_maybe_inline),
        dune_stanza($, "ocamlyacc", $._field_modules_maybe_inline),
        dune_stanza($, "include_subdirs", $.sexp),
        dune_stanza($, "test", $.sexp),
        dune_stanza($, "data_only_dirs", $.file_name),
        dune_stanza($, "cram", $.sexp),
        dune_stanza($, "dirs", $.sexp),
        dune_stanza($, "toplevel", $.sexp),
        dune_stanza($, "install", $.sexp),
        dune_stanza($, "documentation", $.sexp),
        dune_stanza($, "env", $.sexp),
        $._stanza_subdir,
        $.sexp,
      ),
    _field_modules_maybe_inline: ($) =>
      choice($.module_name, dune_field($, "modules", repeat($.module_name))),
    _stanza_alias: ($) =>
      dune_stanza(
        $,
        "alias",
        choice(
          dune_field($, "name", $.alias_name),
          dune_field($, "action", $.action),
          $._deps_field,
          $.sexp,
        ),
      ),
    _stanza_subdir: ($) =>
      wrap(alias("subdir", $.stanza_name), $.file_name, repeat1($.stanza)),
    _stanza_executable: ($) =>
      dune_stanza($, "executable", choice($._field_buildable, $.sexp)),
    _field_buildable: ($) =>
      choice(
        dune_field($, "name", $.module_name),
        dune_field($, "public_name", $.public_name),
        dune_field($, "libraries", repeat($._lib_dep)),
        dune_field($, "modules", optional($._modules_osl)),
        dune_field($, "enabled_if", $.blang),
      ),
    _modules_osl: ($) => dune_osl($.module_name, $._modules_osl),
    _lib_dep: ($) =>
      choice(
        $.library_name,
        dune_field($, "re_export", $.library_name),
        dune_field($, "select", $.sexps1),
      ),
    library_name: ($) => $._atom_or_qs,
    public_name: ($) => $._atom_or_qs,
    module_name: ($) => $._atom_or_qs,
    file_name: ($) => $._atom_or_qs,
    file_name_dep: ($) => $.file_name,
    file_name_target: ($) => $.file_name,
    package_name: ($) => $._atom_or_qs,
    lock_name: ($) => $._atom_or_qs,
    shell_command: ($) => $._atom_or_qs,
    _stanza_rule: ($) =>
      dune_stanza(
        $,
        "rule",
        choice(
          $.action,
          dune_field($, "mode", $._rule_mode),
          dune_field($, "target", $._atom_or_qs),
          dune_field($, "targets", repeat($._target)),
          $._deps_field,
          dune_field($, "action", $.action),
          dune_field($, "enabled_if", $.blang),
          dune_field($, "alias", repeat1($.alias_name)),
          dune_field($, "package", $.package_name),
          dune_field($, "fallback", optional($._bool)),
          dune_field($, "locks", repeat1($.lock_name)),
        ),
      ),
    _deps_field: ($) => dune_field($, "deps", repeat1($._dep)),
    _dep: ($) =>
      choice(
        wrap($.named_variable, repeat1($._dep)),
        wrap("universe"),
        wrap("sandbox", $._atom_or_qs),
        wrap("env_var", $._atom_or_qs),
        wrap(choice("alias", "alias_rec"), $.alias_name),
        wrap("source_tree", $.file_name),
        wrap("package", $.package_name),
        wrap("glob_files", repeat1($._atom_or_qs)),
        $.file_name,
      ),
    _target: ($) => choice($.file_name_target, wrap("dir", $.file_name_target)),
    _bool: ($) => choice("true", "false"),
    _rule_mode: ($) =>
      choice(
        "fallback",
        "promote",
        dune_field($, "promote", $._rule_mode_promote_field),
        dune_field($, "promote-into", $.file_name),
      ),
    _rule_mode_promote_field: ($) =>
      choice(
        dune_field($, "only", $._atom_or_qs),
        dune_field($, "into", $.file_name),
      ),
    blang: ($) => choice($._atom_or_qs, wrap($.blang_op, repeat1($.blang))),
    blang_op: ($) => choice("=", "<>", ">", "<=", "or", "and"),
    field_name: ($) => $._atom_or_qs,
    alias_name: ($) => $._atom_or_qs,
    action: ($) =>
      choice(
        dune_action($, "bash", $.shell_command),
        dune_action($, "cat", $.file_name_dep),
        dune_action($, "cmp", seq($.file_name_dep, $.file_name_dep)),
        dune_action($, "chdir", seq($.file_name, $.action)),
        dune_action($, "copy", seq($.file_name_dep, $.file_name_target)),
        dune_action($, "copy#", seq($.file_name_dep, $.file_name_target)),
        dune_action($, "diff", seq($.file_name_dep, $.file_name_dep)),
        dune_action($, "diff?", seq($.file_name_dep, $.file_name_dep)),
        dune_action($, "echo", repeat1($._atom_or_qs)),
        dune_action($, "ignore-stdout", $.action),
        dune_action($, "no-infer", $.action),
        dune_action($, "pipe-outputs", repeat1($.action)),
        dune_action($, "progn", repeat($.action)),
        dune_action($, "run", seq($.file_name_dep, repeat($._atom_or_qs))),
        dune_action($, "setenv", seq($._atom_or_qs, $._atom_or_qs, $.action)),
        dune_action($, "system", $.shell_command),
        dune_action(
          $,
          "with-accepted-exit-codes",
          seq($._atom_or_qs, $.action),
        ),
        dune_action($, "with-outputs-to", seq($.file_name_target, $.action)),
        dune_action($, "with-stderr-to", seq($.file_name_target, $.action)),
        dune_action($, "with-stdout-to", seq($.file_name_target, $.action)),
        dune_action($, "write-file", seq($.file_name_target, $._atom_or_qs)),
      ),
    _stanza_library: ($) =>
      dune_stanza(
        $,
        "library",
        choice(
          $._field_buildable,
          dune_field($, "synopsis", $._atom_or_qs),
          dune_field($, "instrumentation", $.sexp),
          dune_field(
            $,
            "wrapped",
            choice(
              optional($._bool),
              dune_field($, "transition", $._atom_or_qs),
            ),
          ),
          dune_field($, "kind", $.sexp),
          dune_field($, "ppx.driver", $.sexps1),
          $.sexp,
        ),
      ),
  },
});
