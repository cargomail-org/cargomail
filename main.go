package main

import (
	cargomail "cargomail/cmd"
	"log"
)

func main() {
	err := cargomail.Start()
	if err != nil {
		log.Fatalf("cargomail error: %v", err)
	}
	log.Print("cargomail shutdown gracefully")
}
