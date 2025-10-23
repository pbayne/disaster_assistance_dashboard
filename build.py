#!/usr/bin/env python3
"""
Build script for Databricks application.
Builds the React frontend and prepares the backend for deployment.
"""

import subprocess
import shutil
import sys
from pathlib import Path


def run_command(command: list[str], cwd: Path | None = None) -> bool:
    """Run a shell command and return success status."""
    try:
        print(f"Running: {' '.join(command)}")
        result = subprocess.run(
            command,
            cwd=cwd,
            check=True,
            capture_output=False,
            text=True
        )
        return result.returncode == 0
    except subprocess.CalledProcessError as e:
        print(f"Error running command: {e}")
        return False


def main():
    """Main build process."""
    project_root = Path(__file__).parent
    frontend_dir = project_root / "frontend"
    backend_dir = project_root / "backend"
    frontend_dist = frontend_dir / "dist"
    backend_static = backend_dir / "static"

    print("=" * 60)
    print("Building Databricks Application")
    print("=" * 60)

    # Check if Node.js is installed
    print("\n[1/5] Checking Node.js installation...")
    if not shutil.which("npm"):
        print("Error: npm not found. Please install Node.js and npm.")
        sys.exit(1)
    print("npm found")

    # Install frontend dependencies
    print("\n[2/5] Installing frontend dependencies...")
    if not run_command(["npm", "install"], cwd=frontend_dir):
        print("Error: Failed to install frontend dependencies")
        sys.exit(1)

    # Build frontend
    print("\n[3/5] Building frontend...")
    if not run_command(["npm", "run", "build"], cwd=frontend_dir):
        print("Error: Failed to build frontend")
        sys.exit(1)

    # Check if frontend build exists
    if not frontend_dist.exists():
        print(f"Error: Frontend build directory not found at {frontend_dist}")
        sys.exit(1)

    # Copy frontend build to backend static directory
    print("\n[4/5] Copying frontend build to backend...")
    if backend_static.exists():
        shutil.rmtree(backend_static)
    shutil.copytree(frontend_dist, backend_static)
    print(f"Frontend build copied to {backend_static}")

    # Check Python dependencies
    print("\n[5/5] Checking backend dependencies...")
    requirements_file = backend_dir / "requirements.txt"
    if requirements_file.exists():
        print("Backend requirements.txt found")
        print("Note: Install backend dependencies with: pip install -r backend/requirements.txt")
    else:
        print("Warning: backend/requirements.txt not found")

    print("\n" + "=" * 60)
    print("Build completed successfully!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Install backend dependencies: cd backend && pip install -r requirements.txt")
    print("2. Test locally: cd backend && uvicorn main:app --reload")
    print("3. Deploy to Databricks: python deploy_to_databricks.py")
    print()


if __name__ == "__main__":
    main()
