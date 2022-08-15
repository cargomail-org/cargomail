package cmd

import (
  "github.com/spf13/cobra"
)

var setup = &cobra.Command{
  Use: "setup",
  Run: func(cmd *cobra.Command, args []string) {
    println("Database schema created...")
  },
}