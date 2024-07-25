{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      {
        formatter = pkgs.nixpkgs-fmt;
        devShells.default = pkgs.mkShell {
          nativeBuildInputs = [ pkgs.tree-sitter ];
        };
        packages.default = pkgs.tree-sitter.buildGrammar {
          generate = true;
          version = "n/a";
          src = ./.;
          language = "dune";
        };
      });
}
