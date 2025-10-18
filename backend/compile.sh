#!/bin/bash

echo "🔍 Compiling Fraud Detection Backend..."
echo "=========================================="

# Check if GCC is installed
if ! command -v gcc &> /dev/null; then
    echo "❌ Error: GCC compiler not found!"
    echo "Please install GCC:"
    echo "  Ubuntu/Debian: sudo apt-get install gcc"
    echo "  macOS: xcode-select --install"
    echo "  Windows: Install MinGW-w64"
    exit 1
fi

# Compile the C program
gcc -o fraudbackend fraudbackend.c -std=c99

# Check if compilation was successful
if [ $? -eq 0 ]; then
    echo "✅ Compilation successful!"
    echo "📦 Executable created: fraudbackend"
    echo ""
    echo "🚀 Usage:"
    echo "  Process transaction: ./fraudbackend <accNo> <amount> <location>"
    echo "  View accounts:      ./fraudbackend --accounts"
    echo "  View history:       ./fraudbackend --history"
    echo "  Help:               ./fraudbackend --help"
else
    echo "❌ Compilation failed!"
    exit 1
fi

# Make executable
chmod +x fraudbackend
