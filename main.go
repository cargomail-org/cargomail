package main

import (
  _ "github.com/spf13/cobra"
  _ "github.com/spf13/viper"
  "github.com/umalabs/fedemail/cmd"
)

func main() {
  cmd.Execute()
}