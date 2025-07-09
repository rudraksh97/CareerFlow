#!/bin/bash

# Setup git hooks for PATS version management

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
GIT_HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🔧 Setting up git hooks for version management..."

# Check if we're in a git repository
if [ ! -d "$PROJECT_ROOT/.git" ]; then
    echo "❌ Not in a git repository"
    exit 1
fi

# Make hooks directory if it doesn't exist
mkdir -p "$GIT_HOOKS_DIR"

# Copy and make executable the pre-push hook
if [ -f "$SCRIPT_DIR/git-hooks/pre-push" ]; then
    cp "$SCRIPT_DIR/git-hooks/pre-push" "$GIT_HOOKS_DIR/pre-push"
    chmod +x "$GIT_HOOKS_DIR/pre-push"
    echo "✅ Installed pre-push hook"
else
    echo "❌ pre-push hook not found"
fi

echo ""
echo "🎉 Git hooks setup complete!"
echo ""
echo "The following hooks are now active:"
echo "  - pre-push: Checks version consistency before pushing"
echo ""
echo "To bypass hooks, use --no-verify flag:"
echo "  git push --no-verify" 