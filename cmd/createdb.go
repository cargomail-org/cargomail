package cmd

import (
  "github.com/spf13/cobra"
)

var createDbCmd = &cobra.Command{
  Use: "createdb",
  Run: func(cmd *cobra.Command, args []string) {
    println("Database created...")
  },
}