from fastapi import APIRouter

router = APIRouter(prefix="/",tags=['general'])


@router.get("/robots.txt")
def status():
    return """"# Dock Lab
#
# Project overview:
# Dock Lab is an in-development project exploring a simple way for people to
# share computing resources with peers. A person with an available computer can
# bring it online as a host; another person can connect to an available host
# and use computing capacity provided by that peer. The goal is to make this
# kind of collaboration approachable without requiring every participant to
# build and operate their own server infrastructure.
#
# How the project works:
# The backend is a FastAPI service with account authentication and coordination
# endpoints. Hosts can register an online node and its connection URL, and
# clients can discover registered hosts. The host-side setup currently has
# account login/creation and a connect workflow. It starts a local service,
# exposes it through a temporary SSH tunnel, and registers the resulting URL
# with the coordination service. When a client connects, the host uses Docker
# to start a Python 3.11-slim container and relays interactive terminal input
# and output over a socket connection. The project is intended to make setup
# easy; deployment, compatibility, resource controls, and operational details
# may evolve as the project develops.
#
# Crawling guidance:
# Public project information may be crawled. Do not crawl API or live-session
# endpoints as if they were public web pages. These rules are crawler guidance
# only; they do not provide authentication, authorization, or access control.

User-agent: *
Allow: /
Disallow: /auth/
Disallow: /session/
Disallow: /ws/
"""
