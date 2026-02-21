"""
问答模块初始化

导出问答相关的类和函数。
"""

from .simple_qa import SimpleQA, create_qa

__all__ = [
    "SimpleQA",
    "create_qa",
]
