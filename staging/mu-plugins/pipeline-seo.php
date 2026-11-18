<?php
/**
 * Plugin Name: Pipeline SEO fields
 * Description: Site-side half of the publishing pipeline. Exposes a meta description and
 *              a content hash over the REST API and prints them, plus Article JSON-LD, in <head>.
 *              On a client site an SEO plugin usually does this job; the pipeline only
 *              needs a REST-writable field and a predictable <head>.
 */

add_action('init', function () {
    foreach (['pipeline_meta_description', 'pipeline_content_hash'] as $key) {
        register_post_meta('post', $key, [
            'type'          => 'string',
            'single'        => true,
            'show_in_rest'  => true,
            'auth_callback' => fn() => current_user_can('edit_posts'),
        ]);
    }
});

add_action('wp_head', function () {
    if (!is_singular('post')) {
        return;
    }
    $post        = get_queried_object();
    $description = get_post_meta($post->ID, 'pipeline_meta_description', true);

    if ($description) {
        printf("<meta name=\"description\" content=\"%s\">\n", esc_attr($description));
    }

    // Lets the browser check prove that the page it sees is the content the gate approved.
    $hash = get_post_meta($post->ID, 'pipeline_content_hash', true);
    if ($hash) {
        printf("<meta name=\"pipeline-hash\" content=\"%s\">\n", esc_attr($hash));
    }

    $schema = [
        '@context'         => 'https://schema.org',
        '@type'            => 'Article',
        'headline'         => get_the_title($post),
        'description'      => $description,
        'datePublished'    => get_the_date('c', $post),
        'dateModified'     => get_the_modified_date('c', $post),
        'mainEntityOfPage' => get_permalink($post),
        'author'           => ['@type' => 'Organization', 'name' => get_bloginfo('name')],
    ];
    printf(
        "<script type=\"application/ld+json\">%s</script>\n",
        wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)
    );
}, 5);
