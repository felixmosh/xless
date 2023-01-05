#!/bin/bash
read -p "Enter Discord Incoming Hook: " "discord_incoming_webhook"
vercel secret add discord-incoming-webhook "$discord_incoming_webhook"

read -p "Enter IMGBB API Key: " "imgbb_api_key"
vercel secret add imgbb-api-key "$imgbb_api_key"

vercel deploy
