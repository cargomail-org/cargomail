package main

import (
  _ "github.com/spf13/cobra"
  _ "github.com/spf13/viper"
  "github.com/federizer/fedemail/cmd"
)

func main() {
  cmd.Execute()
}