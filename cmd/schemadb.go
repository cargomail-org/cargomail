package cmd

import (
  "github.com/spf13/cobra"
)

var schemaDbCmd = &cobra.Command{
  Use: "schemadb",
  Run: func(cmd *cobra.Command, args []string) {
    println("Database schema created...")
  },
}