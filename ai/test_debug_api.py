#!/usr/bin/env python3
"""
Debug API Testing Tool
A CLI tool to test the debug endpoints for the Quicksilver application.
"""

import json
import sys
from typing import Optional

import requests
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.table import Table

console = Console()


class DebugAPITester:
    def __init__(
        self, nextjs_base_url: str = "http://localhost:3000", ai_base_url: str = "http://localhost:8000"
    ):
        self.nextjs_base_url = nextjs_base_url
        self.ai_base_url = ai_base_url

    def test_projects(self):
        """Test GET /api/debug/projects endpoint"""
        console.print("\n[bold cyan]Testing: GET /api/debug/projects[/bold cyan]")
        try:
            response = requests.get(f"{self.nextjs_base_url}/api/debug/projects", timeout=10)
            response.raise_for_status()
            data = response.json()

            console.print(f"[green]✓ Success![/green] Status Code: {response.status_code}")
            console.print(f"Total Projects: [bold]{data.get('count', 0)}[/bold]")

            if data.get("projects"):
                table = Table(title="Projects")
                table.add_column("ID", style="cyan")
                table.add_column("Title", style="magenta")
                table.add_column("User ID", style="green")
                table.add_column("File Count", style="yellow")

                for project in data["projects"][:10]:  # Show first 10
                    table.add_row(
                        project.get("id", "")[:8] + "...",
                        project.get("projectTitle", ""),
                        project.get("userId", "")[:8] + "...",
                        str(project.get("fileCount", 0)),
                    )

                console.print(table)

            self._print_json(data)

        except requests.exceptions.RequestException as e:
            console.print(f"[red]✗ Error:[/red] {e}")

    def test_chats(self):
        """Test GET /api/debug/chats endpoint"""
        console.print("\n[bold cyan]Testing: GET /api/debug/chats[/bold cyan]")
        try:
            response = requests.get(f"{self.nextjs_base_url}/api/debug/chats", timeout=10)
            response.raise_for_status()
            data = response.json()

            console.print(f"[green]✓ Success![/green] Status Code: {response.status_code}")
            console.print(f"Total Chats: [bold]{data.get('count', 0)}[/bold]")

            if data.get("chats"):
                table = Table(title="Chats")
                table.add_column("ID", style="cyan")
                table.add_column("Title", style="magenta")
                table.add_column("Project ID", style="green")
                table.add_column("User ID", style="yellow")

                for chat in data["chats"][:10]:  # Show first 10
                    table.add_row(
                        chat.get("id", "")[:8] + "...",
                        chat.get("title", ""),
                        chat.get("projectId", "")[:8] + "...",
                        chat.get("userId", "")[:8] + "...",
                    )

                console.print(table)

            self._print_json(data)

        except requests.exceptions.RequestException as e:
            console.print(f"[red]✗ Error:[/red] {e}")

    def test_messages(self, project_id: Optional[str] = None):
        """Test GET /api/debug/messages endpoint"""
        console.print("\n[bold cyan]Testing: GET /api/debug/messages[/bold cyan]")

        if not project_id:
            project_id = Prompt.ask("Enter Project ID")

        try:
            response = requests.get(
                f"{self.nextjs_base_url}/api/debug/messages",
                params={"projectId": project_id},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            console.print(f"[green]✓ Success![/green] Status Code: {response.status_code}")
            console.print(f"Project ID: [bold]{data.get('projectId')}[/bold]")
            console.print(f"Chat Count: [bold]{data.get('chatCount', 0)}[/bold]")
            console.print(f"Message Count: [bold]{data.get('messageCount', 0)}[/bold]")

            if data.get("messages"):
                table = Table(title="Messages")
                table.add_column("ID", style="cyan")
                table.add_column("Chat ID", style="magenta")
                table.add_column("Role", style="green")
                table.add_column("Created At", style="yellow")

                for msg in data["messages"][:10]:  # Show first 10
                    message_obj = msg.get("message", {})
                    table.add_row(
                        msg.get("id", "")[:8] + "...",
                        msg.get("chatId", "")[:8] + "...",
                        message_obj.get("role", ""),
                        str(msg.get("createdAt", ""))[:19],
                    )

                console.print(table)

            self._print_json(data)

        except requests.exceptions.RequestException as e:
            console.print(f"[red]✗ Error:[/red] {e}")

    def test_embeddings(self, limit: int = 10):
        """Test GET /api/debug/embeddings endpoint"""
        console.print("\n[bold cyan]Testing: GET /api/debug/embeddings[/bold cyan]")

        limit_str = Prompt.ask("Enter limit (default: 10)", default=str(limit))
        limit = int(limit_str)

        try:
            response = requests.get(
                f"{self.ai_base_url}/api/debug/embeddings",
                params={"limit": limit},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()

            console.print(f"[green]✓ Success![/green] Status Code: {response.status_code}")
            console.print(f"Total Embeddings: [bold]{data.get('count', 0)}[/bold]")

            if data.get("embeddings"):
                table = Table(title="Vector Embeddings")
                table.add_column("Document ID", style="cyan")
                table.add_column("Project ID", style="magenta")
                table.add_column("Text Preview", style="green", max_width=50)
                table.add_column("Vector Dim", style="yellow")

                for emb in data["embeddings"][:10]:  # Show first 10
                    text = emb.get("text", "")
                    text_preview = text[:47] + "..." if len(text) > 50 else text
                    vector = emb.get("vector", [])
                    vector_dim = len(vector) if isinstance(vector, list) else "N/A"

                    table.add_row(
                        emb.get("document_id", "")[:8] + "...",
                        emb.get("project_id", "")[:8] + "...",
                        text_preview,
                        str(vector_dim),
                    )

                console.print(table)

            self._print_json(data)

        except requests.exceptions.RequestException as e:
            console.print(f"[red]✗ Error:[/red] {e}")

    def _print_json(self, data: dict):
        """Print JSON response with option to view"""
        view = Prompt.ask("\nView full JSON response?", choices=["y", "n"], default="n")
        if view == "y":
            console.print_json(json.dumps(data, indent=2))

    def show_menu(self):
        """Display the main menu"""
        console.print(Panel.fit(
            "[bold cyan]Debug API Testing Tool[/bold cyan]\n"
            f"NextJS URL: {self.nextjs_base_url}\n"
            f"AI Service URL: {self.ai_base_url}",
            border_style="cyan",
        ))

        while True:
            console.print("\n[bold]Available Tests:[/bold]")
            console.print("  [cyan]1[/cyan]. Test /api/debug/projects")
            console.print("  [cyan]2[/cyan]. Test /api/debug/chats")
            console.print("  [cyan]3[/cyan]. Test /api/debug/messages (requires project ID)")
            console.print("  [cyan]4[/cyan]. Test /api/debug/embeddings")
            console.print("  [cyan]5[/cyan]. Run all tests")
            console.print("  [cyan]6[/cyan]. Change URLs")
            console.print("  [red]0[/red]. Exit")

            choice = Prompt.ask("\nSelect an option", choices=["0", "1", "2", "3", "4", "5", "6"])

            if choice == "0":
                console.print("[yellow]Goodbye![/yellow]")
                sys.exit(0)
            elif choice == "1":
                self.test_projects()
            elif choice == "2":
                self.test_chats()
            elif choice == "3":
                self.test_messages()
            elif choice == "4":
                self.test_embeddings()
            elif choice == "5":
                self.test_projects()
                self.test_chats()
                console.print("\n[yellow]Skipping messages test (requires project ID)[/yellow]")
                self.test_embeddings()
            elif choice == "6":
                self.nextjs_base_url = Prompt.ask("NextJS URL", default=self.nextjs_base_url)
                self.ai_base_url = Prompt.ask("AI Service URL", default=self.ai_base_url)
                console.print("[green]URLs updated![/green]")

            input("\n[dim]Press Enter to continue...[/dim]")


def main():
    # Default URLs
    nextjs_url = "http://localhost:3000"
    ai_url = "http://localhost:8000"

    # Check for command line arguments
    if len(sys.argv) > 1:
        nextjs_url = sys.argv[1]
    if len(sys.argv) > 2:
        ai_url = sys.argv[2]

    tester = DebugAPITester(nextjs_base_url=nextjs_url, ai_base_url=ai_url)
    tester.show_menu()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        console.print("\n[yellow]Interrupted by user. Goodbye![/yellow]")
        sys.exit(0)
