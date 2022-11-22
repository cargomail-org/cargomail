package main

import (
	"github.com/cargomail-org/cargomail/cmd"
	_ "github.com/spf13/cobra"
	_ "github.com/spf13/viper"
)

func main() {
	cmd.Execute()
}
