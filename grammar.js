/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "dune",

  rules: {
    source_file: $ => repeat($.sexp),
    sexp: $ => choice($.atom, $.list),
    atom: $ => /[a-zA-Z_%.:/{}\"|=\\,\-!#]+/,
    list: $ => seq('(', repeat($.sexp), ')'),
  }
});
