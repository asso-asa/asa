---
layout: default
title: Sitemap
permalink: /sitemap/
---
<h1>Sitemap de l'ASA</h1>
<p>Voici la liste complète des pages du site.</p>

<ul>
  {% assign all_pages = site.pages | sort: 'url' %}
  {% for page in all_pages %}
    {% if page.title and page.url != "/sitemap/" and page.url != "/404.html" %}
      <li><a href="{{ page.url | relative_url }}">{{ page.title }}</a></li>
    {% endif %}
  {% endfor %}
</ul>

{% if site.collections %}
  {% for collection in site.collections %}
    {% if collection.label != "posts" %}
      <h2>{{ collection.label | capitalize }}</h2>
      <ul>
        {% for item in collection.docs %}
          {% if item.title %}
            <li><a href="{{ item.url | relative_url }}">{{ item.title }}</a></li>
          {% endif %}
        {% endfor %}
      </ul>
    {% endif %}
  {% endfor %}
{% endif %}
