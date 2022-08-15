package cmd

import (
  "github.com/spf13/cobra"
)

var initialize = &cobra.Command{
  Use: "init",
  Run: func(cmd *cobra.Command, args []string) {
    println("Database created...")
  },
}