package cmd

import (
  "github.com/spf13/cobra"
)

var data = &cobra.Command{
  Use: "data",
  Run: func(cmd *cobra.Command, args []string) {
    println("Database data created...")
  },
}