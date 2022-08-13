package cmd

import (
  "github.com/spf13/cobra"
)

var demoDbCmd = &cobra.Command{
  Use: "demodb",
  Run: func(cmd *cobra.Command, args []string) {
    println("Database demo data created...")
  },
}