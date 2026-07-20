import pytest
from unittest.mock import MagicMock, patch
from kubernetes.client.rest import ApiException
from kubernetes_mcp.client import KubeClient


def test_kube_client_init():
    with patch('kubernetes.config.load_kube_config') as mock_load:
        client = KubeClient()
        assert client.config_loaded is True
        mock_load.assert_called_once()


def test_apply_yaml_parse_error():
    client = KubeClient()
    invalid_yaml = """
    key1: value1
      invalid_indentation: value2
    """
    res = client.apply_yaml(invalid_yaml)
    assert res["success"] is False
    assert "YAML Parse Error" in res["error"]


def test_apply_yaml_validation_error():
    client = KubeClient()
    missing_fields_yaml = """
    apiVersion: v1
    kind: Pod
    """
    res = client.apply_yaml(missing_fields_yaml)
    assert res["success"] is True
    assert len(res["results"]) == 1
    assert res["results"][0]["success"] is False
    assert "metadata.name" in res["results"][0]["error"]
